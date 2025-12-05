import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';

type ApiKey = Tables<'api_keys'>;

// Hash an API key using SHA-256
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const useApiKeys = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchApiKeys = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error: any) {
      toast.error('Error fetching API keys', {
        description: error.message,
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
    if (!user?.id) return null;

    try {
      const key = generateApiKey();
      const keyPreview = key.substring(0, 12) + '...' + key.substring(key.length - 4);
      const keyHash = await hashApiKey(key);

      const { data, error } = await supabase
        .from('api_keys')
        .insert([{
          name,
          key: keyPreview, // Store only the preview, not the full key
          key_preview: keyPreview,
          key_hash: keyHash, // Store the hash for validation
          user_id: user.id,
          permissions,
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('API key created', {
        description: 'Make sure to copy your API key now. You won\'t be able to see it again.',
      });

      fetchApiKeys();
      return { key, keyPreview };
    } catch (error: any) {
      toast.error('Error creating API key', {
        description: error.message,
      });
      return null;
    }
  };

  const rotateApiKey = async (id: string): Promise<{ key: string; keyPreview: string } | null> => {
    try {
      const key = generateApiKey();
      const keyPreview = key.substring(0, 12) + '...' + key.substring(key.length - 4);
      const keyHash = await hashApiKey(key);

      const { error } = await supabase
        .from('api_keys')
        .update({
          key: keyPreview, // Store only the preview, not the full key
          key_preview: keyPreview,
          key_hash: keyHash, // Store the hash for validation
          last_used_at: null,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('API key rotated', {
        description: 'Your new API key has been generated. Make sure to update it in your applications.',
      });

      fetchApiKeys();
      return { key, keyPreview };
    } catch (error: any) {
      toast.error('Error rotating API key', {
        description: error.message,
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

      // Success - no toast needed (SavedIndicator shows feedback)

      fetchApiKeys();
    } catch (error: any) {
      toast.error('Error updating API key', {
        description: error.message,
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

      toast.success('API key deleted', {
        description: 'API key has been deleted successfully',
      });

      fetchApiKeys();
    } catch (error: any) {
      toast.error('Error deleting API key', {
        description: error.message,
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
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchApiKeys();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

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
