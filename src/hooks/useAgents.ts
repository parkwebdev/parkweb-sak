import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Agent = Tables<'agents'>;
type AgentInsert = TablesInsert<'agents'>;
type AgentUpdate = TablesUpdate<'agents'>;

/**
 * Hook for managing AI agents.
 * Provides CRUD operations for agents with real-time updates.
 * 
 * @returns {Object} Agent management methods and state
 * @returns {Agent[]} agents - List of user's agents
 * @returns {boolean} loading - Loading state
 * @returns {Function} createAgent - Create a new agent
 * @returns {Function} updateAgent - Update an existing agent
 * @returns {Function} deleteAgent - Delete an agent
 * @returns {Function} updateDeploymentConfig - Update agent deployment settings
 * @returns {Function} refetch - Manually refresh agents list
 */
export const useAgents = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgents = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      logger.error('Error fetching agents:', error);
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [user?.id]);

  const createAgent = async (agentData: Omit<AgentInsert, 'user_id'>) => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('agents')
        .insert({ ...agentData, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      
      setAgents(prev => [data, ...prev]);
      toast.success('Agent created successfully');
      return data;
    } catch (error) {
      logger.error('Error creating agent:', error);
      toast.error('Failed to create agent');
      return null;
    }
  };

  const updateAgent = async (id: string, updates: AgentUpdate) => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setAgents(prev => prev.map(a => a.id === id ? data : a));
      // Success - no toast needed (SavedIndicator shows feedback in tabs)
      return data;
    } catch (error) {
      logger.error('Error updating agent:', error);
      toast.error('Failed to update agent');
      return null;
    }
  };

  const deleteAgent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setAgents(prev => prev.filter(a => a.id !== id));
      toast.success('Agent deleted successfully');
      return true;
    } catch (error) {
      logger.error('Error deleting agent:', error);
      toast.error('Failed to delete agent');
      return false;
    }
  };

  const updateDeploymentConfig = async (id: string, config: any) => {
    return updateAgent(id, { deployment_config: config });
  };

  return {
    agents,
    loading,
    createAgent,
    updateAgent,
    deleteAgent,
    updateDeploymentConfig,
    refetch: fetchAgents,
  };
};
