import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';

/**
 * Hook for managing agent-level API keys with rate limiting.
 * API keys are hashed before storage and validated server-side.
 * 
 * @param {string} agentId - Agent ID to scope API keys
 * @returns {Object} API key management methods and state
 * @returns {AgentApiKey[]} apiKeys - List of API keys (without secret)
 * @returns {boolean} loading - Loading state
 * @returns {Function} createApiKey - Create a new API key (returns secret once)
 * @returns {Function} updateApiKey - Update key settings (name, rate limits)
 * @returns {Function} revokeApiKey - Revoke an API key
 * @returns {Function} refetch - Manually refresh API keys list
 */

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

// Generate a random API key with prefix
function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'cpk_'; // ChatPad Key prefix
  for (let i = 0; i < 48; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

// Hash API key using SubtleCrypto
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const useAgentApiKeys = (agentId: string) => {
  const [apiKeys, setApiKeys] = useState<AgentApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchApiKeys = useCallback(async () => {
    if (!agentId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agent_api_keys')
        .select('*')
        .eq('agent_id', agentId)
        .is('revoked_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys((data as AgentApiKey[]) || []);
    } catch (error) {
      logger.error('Error fetching API keys:', error);
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const createApiKey = async (name: string = 'Default'): Promise<string | null> => {
    setGenerating(true);
    try {
      // Generate a new API key
      const rawKey = generateApiKey();
      const keyHash = await hashApiKey(rawKey);
      const keyPrefix = rawKey.substring(0, 12) + '...';

      const { data, error } = await supabase
        .from('agent_api_keys')
        .insert({
          agent_id: agentId,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          name,
        })
        .select()
        .single();

      if (error) throw error;

      setApiKeys(prev => [data as AgentApiKey, ...prev]);
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
  };

  const revokeApiKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from('agent_api_keys')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', keyId);

      if (error) throw error;

      setApiKeys(prev => prev.filter(k => k.id !== keyId));
      toast.success('API key revoked');
    } catch (error) {
      logger.error('Error revoking API key:', error);
      toast.error('Failed to revoke API key');
    }
  };

  const updateApiKey = async (keyId: string, updates: { 
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

      setApiKeys(prev => prev.map(k => k.id === keyId ? { ...k, ...updates } : k));
      toast.success('API key updated');
    } catch (error) {
      logger.error('Error updating API key:', error);
      toast.error('Failed to update API key');
    }
  };

  return {
    apiKeys,
    loading,
    generating,
    createApiKey,
    revokeApiKey,
    updateApiKey,
    refetch: fetchApiKeys,
  };
};