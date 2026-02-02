import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AutomationTask, Platform, AutomationAction } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

export function useAutomation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const tasksQuery = useQuery({
    queryKey: ['automation_tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AutomationTask[];
    },
  });

  const pendingTasksQuery = useQuery({
    queryKey: ['automation_tasks', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_tasks')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as AutomationTask[];
    },
    refetchInterval: 5000, // Poll every 5 seconds for desktop app
  });

  const queueTask = useMutation({
    mutationFn: async ({
      listing_id,
      platform,
      action,
      payload,
    }: {
      listing_id: string;
      platform: Platform;
      action: AutomationAction;
      payload?: Json;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('automation_tasks')
        .insert({
          user_id: userData.user.id,
          listing_id,
          platform,
          action,
          payload: payload ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as AutomationTask;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['automation_tasks'] });
      toast({
        title: 'Task queued',
        description: `${variables.action} task for ${variables.platform} added to queue.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to queue task. Please try again.',
        variant: 'destructive',
      });
      console.error('Queue task error:', error);
    },
  });

  const queueMultipleTasks = useMutation({
    mutationFn: async ({
      listing_id,
      platforms,
      action,
      payload,
    }: {
      listing_id: string;
      platforms: Platform[];
      action: AutomationAction;
      payload?: Json;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const tasks = platforms.map((platform) => ({
        user_id: userData.user!.id,
        listing_id,
        platform,
        action,
        payload: payload ?? null,
      }));

      const { data, error } = await supabase
        .from('automation_tasks')
        .insert(tasks)
        .select();

      if (error) throw error;
      return data as AutomationTask[];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['automation_tasks'] });
      toast({
        title: 'Tasks queued',
        description: `${variables.action} tasks queued for ${variables.platforms.length} platforms.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to queue tasks. Please try again.',
        variant: 'destructive',
      });
      console.error('Queue multiple tasks error:', error);
    },
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({
      id,
      status,
      error_message,
    }: {
      id: string;
      status: 'in_progress' | 'completed' | 'failed';
      error_message?: string;
    }) => {
      const updates: Record<string, unknown> = { status };
      
      if (status === 'in_progress') {
        updates.started_at = new Date().toISOString();
      } else if (status === 'completed' || status === 'failed') {
        updates.completed_at = new Date().toISOString();
        if (error_message) {
          updates.error_message = error_message;
        }
      }

      const { data, error } = await supabase
        .from('automation_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as AutomationTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation_tasks'] });
    },
  });

  const cancelTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('automation_tasks')
        .delete()
        .eq('id', id)
        .eq('status', 'pending');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation_tasks'] });
      toast({
        title: 'Task cancelled',
        description: 'The pending task has been removed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to cancel task.',
        variant: 'destructive',
      });
      console.error('Cancel task error:', error);
    },
  });

  return {
    tasks: tasksQuery.data || [],
    pendingTasks: pendingTasksQuery.data || [],
    isLoading: tasksQuery.isLoading,
    queueTask,
    queueMultipleTasks,
    updateTaskStatus,
    cancelTask,
  };
}
