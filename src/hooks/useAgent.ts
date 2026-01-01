/**
 * Agent Hook
 * 
 * Hook for managing the single Ari agent.
 * Each user has exactly one agent (Ari) - this hook provides access to it.
 * Scoped by accountOwnerId to enable team member access.
 * 
 * Uses React Query for:
 * - Automatic caching across all 7+ components that use this hook
 * - Background refetching for fresh data
 * - Real-time updates via Supabase subscription
 * 
 * @module hooks/useAgent
 */

import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAccountOwnerId } from '@/hooks/useAccountOwnerId';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';
import { queryKeys } from '@/lib/query-keys';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import type { Tables, TablesUpdate, Json } from '@/integrations/supabase/types';
import type { AgentDeploymentConfig } from '@/types/metadata';

type Agent = Tables<'agents'>;
type AgentUpdate = TablesUpdate<'agents'>;

/**
 * Fetches the agent for the given user ID (account owner)
 */
async function fetchAgent(accountOwnerId: string): Promise<Agent | null> {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', accountOwnerId)
    .maybeSingle();

  if (error) {
    logger.error('Error fetching agent:', error);
    throw error;
  }

  return data;
}

/**
 * Hook for managing the single Ari agent.
 * Each user has exactly one agent (Ari) - this hook provides access to it.
 * Scoped by accountOwnerId so team members access the owner's agent.
 * 
 * Now powered by React Query - the agent data is cached and shared
 * across all components that use this hook (7+ places in the codebase).
 * 
 * @returns {Object} Agent management methods and state
 * @returns {Agent|null} agent - The user's Ari agent
 * @returns {string|null} agentId - The agent's ID (convenience accessor)
 * @returns {boolean} loading - Loading state
 * @returns {Function} updateAgent - Update the agent
 * @returns {Function} updateDeploymentConfig - Update agent deployment settings
 * @returns {Function} refetch - Manually refresh agent (triggers background refetch)
 */
export const useAgent = () => {
  const { accountOwnerId, loading: ownerLoading } = useAccountOwnerId();
  const queryClient = useQueryClient();

  // Query for agent data with real-time subscription
  // Scoped by accountOwnerId so team members access owner's agent
  const {
    data: agent = null,
    isLoading,
    refetch,
  } = useSupabaseQuery<Agent | null>({
    queryKey: queryKeys.agent.detail(accountOwnerId),
    queryFn: () => fetchAgent(accountOwnerId!),
    enabled: !!accountOwnerId && !ownerLoading,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
    realtime: accountOwnerId ? {
      table: 'agents',
      filter: `user_id=eq.${accountOwnerId}`,
    } : undefined,
  });

  // Mutation for updating agent
  const updateMutation = useMutation({
    mutationFn: async (updates: AgentUpdate) => {
      if (!agent?.id) throw new Error('No agent to update');

      const { data, error } = await supabase
        .from('agents')
        .update(updates)
        .eq('id', agent.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Update the cache immediately with the new data
      queryClient.setQueryData(queryKeys.agent.detail(accountOwnerId), data);
    },
    onError: (error) => {
      logger.error('Error updating agent:', error);
      toast.error('Failed to update agent');
    },
  });

  const updateAgent = async (updates: AgentUpdate): Promise<Agent | null> => {
    try {
      return await updateMutation.mutateAsync(updates);
    } catch {
      return null;
    }
  };

  const updateDeploymentConfig = async (config: AgentDeploymentConfig): Promise<Agent | null> => {
    return updateAgent({ deployment_config: config as unknown as Json });
  };

  return {
    agent,
    agentId: agent?.id || null,
    loading: isLoading,
    updateAgent,
    updateDeploymentConfig,
    refetch: () => { refetch(); },
  };
};
