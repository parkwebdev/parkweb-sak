import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/contexts/OrganizationContext';
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
  const { toast } = useToast();
  const { currentOrg } = useOrganization();

  const fetchWebhooks = async () => {
    if (!currentOrg) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('org_id', currentOrg.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebhooks(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching webhooks',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (webhookId?: string) => {
    if (!currentOrg) return;
    
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
      toast({
        title: 'Error fetching webhook logs',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const createWebhook = async (webhookData: Omit<Webhook, 'id' | 'created_at' | 'updated_at' | 'org_id'>) => {
    if (!currentOrg) return;

    try {
      const { data, error } = await supabase
        .from('webhooks')
        .insert([{ ...webhookData, org_id: currentOrg.id }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Webhook created',
        description: 'Webhook has been created successfully',
      });

      fetchWebhooks();
      return data;
    } catch (error: any) {
      toast({
        title: 'Error creating webhook',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateWebhook = async (id: string, updates: Partial<Omit<Webhook, 'id' | 'created_at' | 'updated_at' | 'org_id'>>) => {
    try {
      const { error } = await supabase
        .from('webhooks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Webhook updated',
        description: 'Webhook has been updated successfully',
      });

      fetchWebhooks();
    } catch (error: any) {
      toast({
        title: 'Error updating webhook',
        description: error.message,
        variant: 'destructive',
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

      toast({
        title: 'Webhook deleted',
        description: 'Webhook has been deleted successfully',
      });

      fetchWebhooks();
    } catch (error: any) {
      toast({
        title: 'Error deleting webhook',
        description: error.message,
        variant: 'destructive',
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

      toast({
        title: 'Test webhook sent',
        description: 'Check the delivery logs for results',
      });

      fetchLogs(id);
      return data;
    } catch (error: any) {
      toast({
        title: 'Error testing webhook',
        description: error.message,
        variant: 'destructive',
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
          filter: `org_id=eq.${currentOrg?.id}`,
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
  }, [currentOrg?.id]);

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
