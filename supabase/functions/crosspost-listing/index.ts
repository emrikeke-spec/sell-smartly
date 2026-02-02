import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CrosspostRequest {
  listing_id: string;
  platforms: string[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { listing_id, platforms } = await req.json() as CrosspostRequest;
    console.log(`Processing crosspost for listing ${listing_id} to platforms: ${platforms.join(', ')}`);

    // Fetch the listing
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listing_id)
      .eq('user_id', user.id)
      .single();

    if (listingError || !listing) {
      console.error('Listing error:', listingError);
      return new Response(
        JSON.stringify({ error: 'Listing not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user's platform credentials
    const { data: credentials, error: credError } = await supabase
      .from('platform_credentials')
      .select('*')
      .eq('user_id', user.id)
      .in('platform', platforms)
      .eq('is_active', true);

    if (credError) {
      console.error('Credentials error:', credError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: Record<string, { success: boolean; message: string; task_id?: string }> = {};
    const missingPlatforms: string[] = [];

    for (const platform of platforms) {
      const cred = credentials?.find(c => c.platform === platform);
      
      if (!cred) {
        missingPlatforms.push(platform);
        results[platform] = { 
          success: false, 
          message: `No credentials saved for ${platform}` 
        };
        continue;
      }

      // Create an automation task for the desktop companion to pick up
      const { data: task, error: taskError } = await supabase
        .from('automation_tasks')
        .insert({
          user_id: user.id,
          listing_id: listing_id,
          platform: platform,
          action: 'post',
          status: 'pending',
          payload: {
            listing: {
              title: listing.title,
              description: listing.description,
              brand: listing.brand,
              size: listing.size,
              condition: listing.condition,
              category: listing.category,
              tags: listing.tags,
              base_price: listing.base_price,
              currency: listing.currency,
              photos: listing.photos,
            },
            credentials: {
              username: cred.username,
              email: cred.email,
              // Password will need to be decrypted by the companion app
              encrypted_password: cred.encrypted_password,
            }
          }
        })
        .select()
        .single();

      if (taskError) {
        console.error(`Task creation error for ${platform}:`, taskError);
        results[platform] = { 
          success: false, 
          message: `Failed to queue task: ${taskError.message}` 
        };
      } else {
        console.log(`Task created for ${platform}: ${task.id}`);
        results[platform] = { 
          success: true, 
          message: 'Task queued for automation',
          task_id: task.id
        };

        // Create/update platform_listing record
        await supabase
          .from('platform_listings')
          .upsert({
            listing_id: listing_id,
            platform: platform,
            status: 'pending',
            optimized_title: listing.title,
            optimized_description: listing.description,
            platform_price: listing.base_price,
            platform_currency: listing.currency,
          }, { onConflict: 'listing_id,platform' });
      }
    }

    const response = {
      success: missingPlatforms.length === 0,
      results,
      message: missingPlatforms.length > 0 
        ? `Missing credentials for: ${missingPlatforms.join(', ')}` 
        : 'All tasks queued successfully'
    };

    console.log('Crosspost response:', response);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Crosspost error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
