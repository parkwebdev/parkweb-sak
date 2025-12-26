/**
 * Hook for managing agent-level API keys with rate limiting.
 * API keys are hashed before storage and validated server-side.
 * Uses React Query for caching with real-time updates.
 * 
 * @module hooks/useAgentApiKeys
 */

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { queryKeys } from '@/lib/query-keys';

interface AgentApiKey {
  id: string;
  agent_id: string;
  key_prefix: string;
  name: string;
  requests_per_minute: number;
  requests_per_day: number;
  current_minute_requests: number;
  current_day_requests: number;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

/**
 * Generate a random API key with prefix
 */
function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'cpk_'; // ChatPad Key prefix
  for (let i = 0; i < 48; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

/**
 * Hash API key using SubtleCrypto
 */
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hook for managing agent-level API keys with rate limiting.
 * 
 * @param agentId - Agent ID to scope API keys
 * @returns API key management methods and state
 */
export const useAgentApiKeys = (agentId: string) => {
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);

  // Fetch API keys with React Query and real-time updates
  const { 
    data: apiKeys = [], 
    isLoading: loading,
    refetch 
  } = useSupabaseQuery<AgentApiKey[]>({
    queryKey: queryKeys.agentApiKeys.list(agentId),
    queryFn: async () => {
      if (!agentId) return [];
      
      const { data, error } = await supabase
        .from('agent_api_keys')
        .select('*')
        .eq('agent_id', agentId)
        .is('revoked_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as AgentApiKey[]) || [];
    },
    realtime: {
      table: 'agent_api_keys',
      filter: `agent_id=eq.${agentId}`,
    },
    enabled: !!agentId,
    staleTime: 30000, // 30 seconds
  });

  const invalidateKeys = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.agentApiKeys.list(agentId) });
  }, [queryClient, agentId]);

  const createApiKey = useCallback(async (name: string = 'Default'): Promise<string | null> => {
    setGenerating(true);
    try {
      // Generate a new API key
      const rawKey = generateApiKey();
      const keyHash = await hashApiKey(rawKey);
      const keyPrefix = rawKey.substring(0, 12) + '...';

      const { error } = await supabase
        .from('agent_api_keys')
        .insert({
          agent_id: agentId,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          name,
        });

      if (error) throw error;

      invalidateKeys();
      toast.success('API key created. Copy it now - you won\'t see it again!');
      
      // Return the raw key (only time it's visible)
      return rawKey;
    } catch (error) {
      logger.error('Error creating API key:', error);
      toast.error('Failed to create API key');
      return null;
    } finally {
      setGenerating(false);
    }
  }, [agentId, invalidateKeys]);

  const revokeApiKey = useCallback(async (keyId: string) => {
    try {
      const { error } = await supabase
        .from('agent_api_keys')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', keyId);

      if (error) throw error;

      invalidateKeys();
      toast.success('API key revoked');
    } catch (error) {
      logger.error('Error revoking API key:', error);
      toast.error('Failed to revoke API key');
    }
  }, [invalidateKeys]);

  const updateApiKey = useCallback(async (keyId: string, updates: { 
    name?: string;
    requests_per_minute?: number; 
    requests_per_day?: number;
  }) => {
    try {
      const { error } = await supabase
        .from('agent_api_keys')
        .update(updates)
        .eq('id', keyId);

      if (error) throw error;

      invalidateKeys();
      toast.success('API key updated');
    } catch (error) {
      logger.error('Error updating API key:', error);
      toast.error('Failed to update API key');
    }
  }, [invalidateKeys]);

  return {
    apiKeys,
    loading,
    generating,
    createApiKey,
    revokeApiKey,
    updateApiKey,
    refetch,
  };
};
