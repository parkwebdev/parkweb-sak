/**
 * Automation Executions Hook
 * Fetches execution history for an automation with real-time updates.
 * 
 * @module hooks/useAutomationExecutions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/query-keys';
import { useEffect } from 'react';
import type { AutomationExecution } from '@/types/automations';
import { toast } from 'sonner';
import { getErrorMessage } from '@/types/errors';

interface UseAutomationExecutionsOptions {
  automationId: string;
  limit?: number;
}

export function useAutomationExecutions({ 
  automationId, 
  limit = 50 
}: UseAutomationExecutionsOptions) {
  const queryClient = useQueryClient();

  // Fetch executions
  const { 
    data: executions = [], 
    isLoading,
    error,
    refetch 
  } = useQuery({
    queryKey: [...queryKeys.automations.all, automationId, 'executions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_executions')
        .select('*')
        .eq('automation_id', automationId)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as AutomationExecution[];
    },
    enabled: !!automationId,
  });

  // Real-time subscription for execution updates
  useEffect(() => {
    if (!automationId) return;

    const channel = supabase
      .channel(`automation-executions-${automationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'automation_executions',
          filter: `automation_id=eq.${automationId}`,
        },
        () => {
          // Refetch on any change
          queryClient.invalidateQueries({
            queryKey: [...queryKeys.automations.all, automationId, 'executions'],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [automationId, queryClient]);

  // Trigger manual execution
  const { mutateAsync: triggerExecution, isPending: triggering } = useMutation({
    mutationFn: async (options: {
      triggerData?: Record<string, unknown>;
      testMode?: boolean;
      conversationId?: string;
      leadId?: string;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `https://mvaimvwdukpgvkifkfpa.supabase.co/functions/v1/trigger-automation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            source: 'manual',
            automationId,
            triggerData: options.triggerData || {},
            testMode: options.testMode || false,
            conversationId: options.conversationId,
            leadId: options.leadId,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      return response.json();
    },
    onSuccess: (data) => {
      if (data.results?.[0]?.error) {
        toast.error('Execution failed', { description: data.results[0].error });
      } else {
        toast.success('Automation triggered');
      }
      refetch();
    },
    onError: (error: unknown) => {
      toast.error('Failed to trigger automation', { 
        description: getErrorMessage(error) 
      });
    },
  });

  return {
    executions,
    loading: isLoading,
    error,
    refetch,
    triggerExecution,
    triggering,
  };
}

/**
 * Fetch a single execution by ID with real-time updates
 */
export function useAutomationExecution(executionId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...queryKeys.automations.all, 'execution', executionId],
    queryFn: async () => {
      if (!executionId) return null;

      const { data, error } = await supabase
        .from('automation_executions')
        .select('*')
        .eq('id', executionId)
        .maybeSingle();

      if (error) throw error;
      return data as AutomationExecution | null;
    },
    enabled: !!executionId,
    // Refetch more frequently for running executions
    refetchInterval: (query) => {
      const data = query.state.data as AutomationExecution | null;
      if (data?.status === 'running' || data?.status === 'pending') {
        return 1000; // Poll every second for active executions
      }
      return false;
    },
  });

  // Real-time subscription for this specific execution
  useEffect(() => {
    if (!executionId) return;

    const channel = supabase
      .channel(`execution-${executionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'automation_executions',
          filter: `id=eq.${executionId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: [...queryKeys.automations.all, 'execution', executionId],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [executionId, queryClient]);

  return query;
}
