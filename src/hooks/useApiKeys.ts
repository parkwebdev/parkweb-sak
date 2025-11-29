import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { Tables } from '@/integrations/supabase/types';

type ApiKey = Tables<'api_keys'>;

export const useApiKeys = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { currentOrg } = useOrganization();

  const fetchApiKeys = async () => {
    if (!currentOrg) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('org_id', currentOrg.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching API keys',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = (): string => {
    // Generate a secure random API key (32 bytes = 64 hex characters)
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return 'pk_' + Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const createApiKey = async (
    name: string,
    permissions: string[] = []
  ): Promise<{ key: string; keyPreview: string } | null> => {
    if (!currentOrg) return null;

    try {
      const key = generateApiKey();
      const keyPreview = key.substring(0, 12) + '...' + key.substring(key.length - 4);

      const { data, error } = await supabase
        .from('api_keys')
        .insert([{
          name,
          key,
          key_preview: keyPreview,
          org_id: currentOrg.id,
          permissions,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'API key created',
        description: 'Make sure to copy your API key now. You won\'t be able to see it again.',
      });

      fetchApiKeys();
      return { key, keyPreview };
    } catch (error: any) {
      toast({
        title: 'Error creating API key',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const rotateApiKey = async (id: string): Promise<{ key: string; keyPreview: string } | null> => {
    try {
      const key = generateApiKey();
      const keyPreview = key.substring(0, 12) + '...' + key.substring(key.length - 4);

      const { error } = await supabase
        .from('api_keys')
        .update({
          key,
          key_preview: keyPreview,
          last_used_at: null,
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'API key rotated',
        description: 'Your new API key has been generated. Make sure to update it in your applications.',
      });

      fetchApiKeys();
      return { key, keyPreview };
    } catch (error: any) {
      toast({
        title: 'Error rotating API key',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateApiKey = async (id: string, updates: Partial<Pick<ApiKey, 'name' | 'permissions'>>) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'API key updated',
        description: 'API key has been updated successfully',
      });

      fetchApiKeys();
    } catch (error: any) {
      toast({
        title: 'Error updating API key',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteApiKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'API key deleted',
        description: 'API key has been deleted successfully',
      });

      fetchApiKeys();
    } catch (error: any) {
      toast({
        title: 'Error deleting API key',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchApiKeys();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('api-keys-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'api_keys',
          filter: `org_id=eq.${currentOrg?.id}`,
        },
        () => {
          fetchApiKeys();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOrg?.id]);

  return {
    apiKeys,
    loading,
    createApiKey,
    rotateApiKey,
    updateApiKey,
    deleteApiKey,
    refetch: fetchApiKeys,
  };
};
