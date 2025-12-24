import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/types/errors';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { queryKeys } from '@/lib/query-keys';
import type { Tables } from '@/integrations/supabase/types';

type Webhook = Tables<'webhooks'>;
type WebhookLog = {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: unknown;
  response_status: number | null;
  response_body: string | null;
  error_message: string | null;
  retry_count: number;
  delivered: boolean;
  created_at: string;
  delivered_at: string | null;
};

/**
 * Hook for managing webhooks and their delivery logs.
 * Uses React Query for caching and real-time updates.
 * 
 * @param {string} agentId - Agent ID to scope webhooks
 * @returns {Object} Webhook management methods and state
 */
export const useWebhooks = (agentId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [logs, setLogs] = useState<WebhookLog[]>([]);

  // Fetch webhooks with React Query
  const { data: webhooks = [], isLoading: loading, refetch } = useSupabaseQuery<Webhook[]>({
    queryKey: queryKeys.webhooks.list(agentId),
    queryFn: async () => {
      if (!user || !agentId) return [];
      
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    realtime: {
      table: 'webhooks',
      filter: `agent_id=eq.${agentId}`,
    },
    enabled: !!user && !!agentId,
    staleTime: 30000, // 30 seconds
  });

  const invalidateWebhooks = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.webhooks.all });
  }, [queryClient]);

  const fetchLogs = useCallback(async (webhookId?: string) => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (webhookId) {
        query = query.eq('webhook_id', webhookId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error: unknown) {
      toast.error('Error fetching webhook logs', {
        description: getErrorMessage(error),
      });
    }
  }, [user]);

  const createWebhook = useCallback(async (
    webhookData: Omit<Webhook, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'agent_id'>
  ) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('webhooks')
        .insert([{ ...webhookData, user_id: user.id, agent_id: agentId || null }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Webhook created', {
        description: 'Webhook has been created successfully',
      });

      await invalidateWebhooks();
      return data;
    } catch (error: unknown) {
      toast.error('Error creating webhook', {
        description: getErrorMessage(error),
      });
      throw error;
    }
  }, [user, agentId, invalidateWebhooks]);

  const updateWebhook = useCallback(async (
    id: string, 
    updates: Partial<Omit<Webhook, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'agent_id'>>
  ) => {
    try {
      const { error } = await supabase
        .from('webhooks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Success - no toast needed (SavedIndicator shows feedback)
      await invalidateWebhooks();
    } catch (error: unknown) {
      toast.error('Error updating webhook', {
        description: getErrorMessage(error),
      });
      throw error;
    }
  }, [invalidateWebhooks]);

  const deleteWebhook = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Webhook deleted', {
        description: 'Webhook has been deleted successfully',
      });

      await invalidateWebhooks();
    } catch (error: unknown) {
      toast.error('Error deleting webhook', {
        description: getErrorMessage(error),
      });
      throw error;
    }
  }, [invalidateWebhooks]);

  const testWebhook = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('trigger-webhook', {
        body: { 
          webhookId: id,
          testMode: true 
        },
      });

      if (error) throw error;

      toast.success('Test webhook sent', {
        description: 'Check the delivery logs for results',
      });

      await fetchLogs(id);
      return data;
    } catch (error: unknown) {
      toast.error('Error testing webhook', {
        description: getErrorMessage(error),
      });
      throw error;
    }
  }, [fetchLogs]);

  return {
    webhooks,
    logs,
    loading,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    testWebhook,
    fetchLogs,
    refetch,
  };
};
