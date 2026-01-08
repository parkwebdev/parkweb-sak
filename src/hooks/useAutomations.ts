/**
 * Automations Hook
 * 
 * Provides CRUD operations for automations with real-time updates.
 * Uses accountOwnerId for proper team data scoping.
 * 
 * @module hooks/useAutomations
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery';
import { useAccountOwnerId } from '@/hooks/useAccountOwnerId';
import { useAgent } from '@/hooks/useAgent';
import { queryKeys } from '@/lib/query-keys';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/types/errors';
import { AUTOMATION_LIST_COLUMNS } from '@/lib/db-selects';
import type { 
  Automation, 
  AutomationListItem, 
  CreateAutomationData,
  AutomationNode,
  AutomationEdge,
  AutomationStatus,
  AutomationTriggerType,
  AutomationTriggerConfig,
} from '@/types/automations';
import type { Viewport } from '@xyflow/react';
import type { Json } from '@/integrations/supabase/types';

/**
 * Hook for managing automations with CRUD operations.
 * 
 * @example
 * ```tsx
 * const { automations, loading, createAutomation, updateAutomation, deleteAutomation } = useAutomations();
 * ```
 */
export function useAutomations() {
  const { accountOwnerId, loading: ownerLoading } = useAccountOwnerId();
  const { agent, loading: agentLoading } = useAgent();
  const queryClient = useQueryClient();

  // Fetch automations list
  const { 
    data: automations = [], 
    isLoading: automationsLoading,
    refetch,
  } = useSupabaseQuery<AutomationListItem[]>({
    queryKey: queryKeys.automations.list(accountOwnerId ?? ''),
    queryFn: async () => {
      if (!accountOwnerId) return [];
      
      const { data, error } = await supabase
        .from('automations')
        .select(AUTOMATION_LIST_COLUMNS)
        .eq('user_id', accountOwnerId)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform database records to typed AutomationListItem
      return (data || []).map((item): AutomationListItem => ({
        id: item.id,
        agent_id: item.agent_id,
        user_id: item.user_id,
        name: item.name,
        description: item.description,
        icon: item.icon ?? 'Zap',
        color: item.color ?? 'blue',
        status: item.status as AutomationStatus,
        enabled: item.enabled,
        trigger_type: item.trigger_type as AutomationTriggerType,
        trigger_config: item.trigger_config as AutomationTriggerConfig,
        execution_count: item.execution_count,
        last_executed_at: item.last_executed_at,
        last_execution_status: item.last_execution_status,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));
    },
    realtime: {
      table: 'automations',
      filter: accountOwnerId ? `user_id=eq.${accountOwnerId}` : undefined,
    },
    enabled: !!accountOwnerId,
  });

  // Fetch single automation with full details - memoized to prevent infinite loops
  const getAutomation = useCallback(async (id: string): Promise<Automation | null> => {
    const { data, error } = await supabase
      .from('automations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      toast.error('Failed to load automation', { description: getErrorMessage(error) });
      return null;
    }
    
    return {
      id: data.id,
      agent_id: data.agent_id,
      user_id: data.user_id,
      name: data.name,
      description: data.description,
      icon: data.icon ?? 'Zap',
      color: data.color ?? 'blue',
      status: data.status as AutomationStatus,
      enabled: data.enabled,
      trigger_type: data.trigger_type as AutomationTriggerType,
      trigger_config: data.trigger_config as AutomationTriggerConfig,
      nodes: (data.nodes as unknown as AutomationNode[]) || [],
      edges: (data.edges as unknown as AutomationEdge[]) || [],
      viewport: (data.viewport as unknown as Viewport) || { x: 0, y: 0, zoom: 1 },
      execution_count: data.execution_count,
      last_executed_at: data.last_executed_at,
      last_execution_status: data.last_execution_status,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }, []);

  // Create automation mutation
  const createMutation = useSupabaseMutation({
    mutationFn: async (data: CreateAutomationData): Promise<Automation> => {
      if (!accountOwnerId || !agent?.id) {
        throw new Error('Missing account owner or agent');
      }

      // Create default trigger node based on trigger type
      const triggerNode: AutomationNode = {
        id: 'trigger-1',
        type: `trigger-${data.trigger_type === 'ai_tool' ? 'ai-tool' : data.trigger_type}` as AutomationNode['type'],
        position: { x: 250, y: 50 },
        data: {
          label: `${data.trigger_type.charAt(0).toUpperCase() + data.trigger_type.slice(1)} Trigger`,
        },
      };

      const { data: created, error } = await supabase
        .from('automations')
        .insert({
          user_id: accountOwnerId,
          agent_id: agent.id,
          name: data.name,
          description: data.description ?? null,
          icon: data.icon ?? 'Zap',
          color: data.color ?? 'blue',
          trigger_type: data.trigger_type,
          trigger_config: (data.trigger_config ?? {}) as Json,
          nodes: [triggerNode] as unknown as Json,
          edges: [] as unknown as Json,
          viewport: { x: 0, y: 0, zoom: 1 } as unknown as Json,
          status: 'draft',
          enabled: false,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: created.id,
        agent_id: created.agent_id,
        user_id: created.user_id,
        name: created.name,
        description: created.description,
        icon: created.icon ?? 'Zap',
        color: created.color ?? 'blue',
        status: created.status as AutomationStatus,
        enabled: created.enabled,
        trigger_type: created.trigger_type as AutomationTriggerType,
        trigger_config: created.trigger_config as AutomationTriggerConfig,
        nodes: (created.nodes as unknown as AutomationNode[]) || [],
        edges: (created.edges as unknown as AutomationEdge[]) || [],
        viewport: (created.viewport as unknown as Viewport) || { x: 0, y: 0, zoom: 1 },
        execution_count: created.execution_count,
        last_executed_at: created.last_executed_at,
        last_execution_status: created.last_execution_status,
        created_at: created.created_at,
        updated_at: created.updated_at,
      };
    },
    invalidateKeys: [queryKeys.automations.all],
    onSuccess: () => {
      toast.success('Automation created');
    },
    onError: (error: unknown) => {
      toast.error('Failed to create automation', { description: getErrorMessage(error) });
    },
  });

  // Update automation mutation
  const updateMutation = useSupabaseMutation({
    mutationFn: async ({ 
      id, 
      ...updates 
    }: Partial<Automation> & { id: string }): Promise<Automation> => {
      const updateData: Record<string, unknown> = {};

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.icon !== undefined) updateData.icon = updates.icon;
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.enabled !== undefined) updateData.enabled = updates.enabled;
      if (updates.trigger_type !== undefined) updateData.trigger_type = updates.trigger_type;
      if (updates.trigger_config !== undefined) updateData.trigger_config = updates.trigger_config as Json;
      if (updates.nodes !== undefined) updateData.nodes = updates.nodes as unknown as Json;
      if (updates.edges !== undefined) updateData.edges = updates.edges as unknown as Json;
      if (updates.viewport !== undefined) updateData.viewport = updates.viewport as unknown as Json;

      const { data, error } = await supabase
        .from('automations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        agent_id: data.agent_id,
        user_id: data.user_id,
        name: data.name,
        description: data.description,
        icon: data.icon ?? 'Zap',
        color: data.color ?? 'blue',
        status: data.status as AutomationStatus,
        enabled: data.enabled,
        trigger_type: data.trigger_type as AutomationTriggerType,
        trigger_config: data.trigger_config as AutomationTriggerConfig,
        nodes: (data.nodes as unknown as AutomationNode[]) || [],
        edges: (data.edges as unknown as AutomationEdge[]) || [],
        viewport: (data.viewport as unknown as Viewport) || { x: 0, y: 0, zoom: 1 },
        execution_count: data.execution_count,
        last_executed_at: data.last_executed_at,
        last_execution_status: data.last_execution_status,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    },
    invalidateKeys: [queryKeys.automations.all],
    onError: (error: unknown) => {
      toast.error('Failed to update automation', { description: getErrorMessage(error) });
    },
  });

  // Delete automation mutation
  const deleteMutation = useSupabaseMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('automations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    invalidateKeys: [queryKeys.automations.all],
    onSuccess: () => {
      toast.success('Automation deleted');
    },
    onError: (error: unknown) => {
      toast.error('Failed to delete automation', { description: getErrorMessage(error) });
    },
  });

  return {
    // Data
    automations,
    
    // Loading states
    loading: ownerLoading || agentLoading || automationsLoading,
    creating: createMutation.isPending,
    updating: updateMutation.isPending,
    deleting: deleteMutation.isPending,
    
    // Operations
    getAutomation,
    createAutomation: createMutation.mutateAsync,
    updateAutomation: updateMutation.mutateAsync,
    deleteAutomation: deleteMutation.mutateAsync,
    refetch,
  };
}
