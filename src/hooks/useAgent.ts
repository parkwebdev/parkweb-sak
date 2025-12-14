import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';
import type { Tables, TablesUpdate, Json } from '@/integrations/supabase/types';
import type { AgentDeploymentConfig } from '@/types/metadata';

type Agent = Tables<'agents'>;
type AgentUpdate = TablesUpdate<'agents'>;

/**
 * Hook for managing the single Ari agent.
 * Each user has exactly one agent (Ari) - this hook provides access to it.
 * 
 * @returns {Object} Agent management methods and state
 * @returns {Agent|null} agent - The user's Ari agent
 * @returns {boolean} loading - Loading state (only true on initial load)
 * @returns {Function} updateAgent - Update the agent
 * @returns {Function} updateDeploymentConfig - Update agent deployment settings
 * @returns {Function} refetch - Manually refresh agent (silent, no loading state)
 */
export const useAgent = () => {
  const { user } = useAuth();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);

  const fetchAgent = async (isRefetch = false) => {
    if (!user?.id) return;
    
    // Only show loading state on initial load, not refetches
    if (!isRefetch && !initialLoadDone.current) {
      setLoading(true);
    }
    
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setAgent(data);
      initialLoadDone.current = true;
    } catch (error) {
      logger.error('Error fetching agent:', error);
      toast.error('Failed to load agent');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgent(false);
  }, [user?.id]);

  const updateAgent = async (updates: AgentUpdate) => {
    if (!agent?.id) return null;

    try {
      const { data, error } = await supabase
        .from('agents')
        .update(updates)
        .eq('id', agent.id)
        .select()
        .single();

      if (error) throw error;
      
      setAgent(data);
      // Success - no toast needed (SavedIndicator shows feedback in tabs)
      return data;
    } catch (error) {
      logger.error('Error updating agent:', error);
      toast.error('Failed to update agent');
      return null;
    }
  };

  const updateDeploymentConfig = async (config: AgentDeploymentConfig) => {
    return updateAgent({ deployment_config: config as unknown as Json });
  };

  return {
    agent,
    agentId: agent?.id || null,
    loading,
    updateAgent,
    updateDeploymentConfig,
    refetch: () => fetchAgent(true),
  };
};
