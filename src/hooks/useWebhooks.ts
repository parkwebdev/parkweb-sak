import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/types/errors';
import { useAuth } from '@/hooks/useAuth';
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
 * Webhooks are scoped to agents and support multiple event types.
 * 
 * @param {string} [agentId] - Optional agent ID to scope webhooks
 * @returns {Object} Webhook management methods and state
 * @returns {Webhook[]} webhooks - List of webhooks
 * @returns {WebhookLog[]} logs - Webhook delivery logs
 * @returns {boolean} loading - Loading state
 * @returns {Function} createWebhook - Create a new webhook
 * @returns {Function} updateWebhook - Update an existing webhook
 * @returns {Function} deleteWebhook - Delete a webhook
 * @returns {Function} testWebhook - Send a test webhook
 * @returns {Function} fetchLogs - Fetch delivery logs
 * @returns {Function} refetch - Manually refresh webhooks list
 */
export const useWebhooks = (agentId?: string) => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchWebhooks = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      let query = supabase
        .from('webhooks')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter by agent_id if provided, otherwise by user_id (for backwards compatibility)
      if (agentId) {
        query = query.eq('agent_id', agentId);
      } else {
        query = query.eq('user_id', user.id).is('agent_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      setWebhooks(data || []);
    } catch (error: unknown) {
      toast.error('Error fetching webhooks', {
        description: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (webhookId?: string) => {
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
  };

  const createWebhook = async (webhookData: Omit<Webhook, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'agent_id'>) => {
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

      fetchWebhooks();
      return data;
    } catch (error: unknown) {
      toast.error('Error creating webhook', {
        description: getErrorMessage(error),
      });
      throw error;
    }
  };

  const updateWebhook = async (id: string, updates: Partial<Omit<Webhook, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'agent_id'>>) => {
    try {
      const { error } = await supabase
        .from('webhooks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Success - no toast needed (SavedIndicator shows feedback)
      fetchWebhooks();
    } catch (error: unknown) {
      toast.error('Error updating webhook', {
        description: getErrorMessage(error),
      });
      throw error;
    }
  };

  const deleteWebhook = async (id: string) => {
    try {
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Webhook deleted', {
        description: 'Webhook has been deleted successfully',
      });

      fetchWebhooks();
    } catch (error: unknown) {
      toast.error('Error deleting webhook', {
        description: getErrorMessage(error),
      });
      throw error;
    }
  };

  const testWebhook = async (id: string) => {
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

      fetchLogs(id);
      return data;
    } catch (error: unknown) {
      toast.error('Error testing webhook', {
        description: getErrorMessage(error),
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchWebhooks();

    // Subscribe to real-time updates
    const filter = agentId 
      ? `agent_id=eq.${agentId}` 
      : `user_id=eq.${user?.id}`;
    
    const channel = supabase
      .channel(`webhooks-changes-${agentId || user?.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'webhooks',
          filter,
        },
        () => {
          fetchWebhooks();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'webhook_logs',
        },
        () => {
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, agentId]);

  return {
    webhooks,
    logs,
    loading,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    testWebhook,
    fetchLogs,
    refetch: fetchWebhooks,
  };
};
