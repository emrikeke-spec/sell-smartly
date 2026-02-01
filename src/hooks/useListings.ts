import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Listing, PlatformListing, Condition } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function useListings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const listingsQuery = useQuery({
    queryKey: ['listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Listing[];
    },
  });

  const platformListingsQuery = useQuery({
    queryKey: ['platform_listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_listings')
        .select('*');

      if (error) throw error;
      return data as PlatformListing[];
    },
  });

  const createListing = useMutation({
    mutationFn: async (listing: Omit<Listing, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('listings')
        .insert({
          ...listing,
          user_id: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Listing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      toast({
        title: 'Listing created',
        description: 'Your listing has been saved successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create listing. Please try again.',
        variant: 'destructive',
      });
      console.error('Create listing error:', error);
    },
  });

  const updateListing = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Listing> & { id: string }) => {
      const { data, error } = await supabase
        .from('listings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Listing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      toast({
        title: 'Listing updated',
        description: 'Your changes have been saved.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update listing. Please try again.',
        variant: 'destructive',
      });
      console.error('Update listing error:', error);
    },
  });

  const deleteListing = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('listings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      toast({
        title: 'Listing deleted',
        description: 'The listing has been removed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete listing. Please try again.',
        variant: 'destructive',
      });
      console.error('Delete listing error:', error);
    },
  });

  const markAsSold = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('listings')
        .update({ status: 'sold' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      toast({
        title: 'Item marked as sold',
        description: 'Remember to delist from other platforms.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update listing. Please try again.',
        variant: 'destructive',
      });
      console.error('Mark sold error:', error);
    },
  });

  const createPlatformListing = useMutation({
    mutationFn: async (
      platformListing: Omit<PlatformListing, 'id' | 'created_at' | 'updated_at'>
    ) => {
      const { data, error } = await supabase
        .from('platform_listings')
        .insert(platformListing)
        .select()
        .single();

      if (error) throw error;
      return data as PlatformListing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform_listings'] });
    },
    onError: (error) => {
      console.error('Create platform listing error:', error);
    },
  });

  const updatePlatformListing = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<PlatformListing> & { id: string }) => {
      const { data, error } = await supabase
        .from('platform_listings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as PlatformListing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform_listings'] });
    },
    onError: (error) => {
      console.error('Update platform listing error:', error);
    },
  });

  return {
    listings: listingsQuery.data || [],
    platformListings: platformListingsQuery.data || [],
    isLoading: listingsQuery.isLoading || platformListingsQuery.isLoading,
    createListing,
    updateListing,
    deleteListing,
    markAsSold,
    createPlatformListing,
    updatePlatformListing,
  };
}
