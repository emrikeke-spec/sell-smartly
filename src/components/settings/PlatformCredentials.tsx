import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink, CheckCircle, Info } from 'lucide-react';

const PLATFORMS = [
  { 
    id: 'grailed', 
    name: 'Grailed', 
    icon: '🏷️', 
    loginUrl: 'https://www.grailed.com',
    description: 'Menswear marketplace'
  },
  { 
    id: 'vinted', 
    name: 'Vinted', 
    icon: '👗', 
    loginUrl: 'https://www.vinted.com',
    description: 'European fashion marketplace'
  },
  { 
    id: 'plick', 
    name: 'Plick', 
    icon: '🇸🇪', 
    loginUrl: 'https://www.plick.se',
    description: 'Swedish secondhand platform'
  },
];

export function PlatformCredentials() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadConnectedPlatforms();
    }
  }, [user]);

  const loadConnectedPlatforms = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('platform_credentials')
      .select('platform')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (data) {
      setConnectedPlatforms(data.map(d => d.platform));
    }
  };

  const openLoginPage = (platform: typeof PLATFORMS[0]) => {
    window.open(platform.loginUrl, '_blank', 'noopener,noreferrer');
    toast({
      title: `Opening ${platform.name}`,
      description: 'Log in to your account in the new tab',
    });
  };

  const markAsConnected = async (platformId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('platform_credentials')
      .upsert({
        user_id: user.id,
        platform: platformId,
        encrypted_password: 'session-based', // Not storing actual password
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,platform' });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to save connection status',
        variant: 'destructive',
      });
    } else {
      setConnectedPlatforms(prev => [...new Set([...prev, platformId])]);
      toast({
        title: 'Connected',
        description: `${platformId.charAt(0).toUpperCase() + platformId.slice(1)} marked as connected`,
      });
    }
  };

  const disconnect = async (platformId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('platform_credentials')
      .delete()
      .eq('user_id', user.id)
      .eq('platform', platformId);

    if (!error) {
      setConnectedPlatforms(prev => prev.filter(p => p !== platformId));
      toast({
        title: 'Disconnected',
        description: `${platformId.charAt(0).toUpperCase() + platformId.slice(1)} removed`,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Connections</CardTitle>
        <CardDescription>
          Log in to each platform in your browser, then mark them as connected. 
          The desktop companion will use your existing browser sessions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {PLATFORMS.map((platform) => {
          const isConnected = connectedPlatforms.includes(platform.id);
          
          return (
            <div key={platform.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <span className="text-2xl">{platform.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{platform.name}</span>
                    {isConnected && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Connected
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{platform.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openLoginPage(platform)}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Login
                </Button>
                
                {isConnected ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => disconnect(platform.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => markAsConnected(platform.id)}
                  >
                    Mark Connected
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">How it works</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Click "Open Login" to go to the platform's login page</li>
                <li>Log in with your account in the new tab</li>
                <li>Come back here and click "Mark Connected"</li>
                <li>The desktop companion will use your browser session to post listings</li>
              </ol>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
