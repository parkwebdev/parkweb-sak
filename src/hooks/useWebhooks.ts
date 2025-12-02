import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';

type Webhook = Tables<'webhooks'>;
type WebhookLog = {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: any;
  response_status: number | null;
  response_body: string | null;
  error_message: string | null;
  retry_count: number;
  delivered: boolean;
  created_at: string;
  delivered_at: string | null;
};

export const useWebhooks = () => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchWebhooks = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebhooks(data || []);
    } catch (error: any) {
      toast.error('Error fetching webhooks', {
        description: error.message,
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
    } catch (error: any) {
      toast.error('Error fetching webhook logs', {
        description: error.message,
      });
    }
  };

  const createWebhook = async (webhookData: Omit<Webhook, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('webhooks')
        .insert([{ ...webhookData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Webhook created', {
        description: 'Webhook has been created successfully',
      });

      fetchWebhooks();
      return data;
    } catch (error: any) {
      toast.error('Error creating webhook', {
        description: error.message,
      });
      throw error;
    }
  };

  const updateWebhook = async (id: string, updates: Partial<Omit<Webhook, 'id' | 'created_at' | 'updated_at' | 'user_id'>>) => {
    try {
      const { error } = await supabase
        .from('webhooks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Success - no toast needed (SavedIndicator shows feedback)
      fetchWebhooks();
    } catch (error: any) {
      toast.error('Error updating webhook', {
        description: error.message,
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
    } catch (error: any) {
      toast.error('Error deleting webhook', {
        description: error.message,
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
    } catch (error: any) {
      toast.error('Error testing webhook', {
        description: error.message,
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchWebhooks();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('webhooks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'webhooks',
          filter: `user_id=eq.${user?.id}`,
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
  }, [user?.id]);

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
