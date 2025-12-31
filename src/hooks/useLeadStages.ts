/**
 * @fileoverview Hook for managing custom lead stages/pipeline statuses.
 * Provides CRUD operations with real-time updates.
 */

import { useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { queryKeys } from '@/lib/query-keys';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export interface LeadStage {
  id: string;
  user_id: string;
  name: string;
  color: string;
  order_index: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export function useLeadStages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch stages for current account
  const { data: stages = [], isLoading: loading, refetch } = useSupabaseQuery<LeadStage[]>({
    queryKey: queryKeys.leadStages,
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('lead_stages')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      return (data || []) as LeadStage[];
    },
    realtime: user ? {
      table: 'lead_stages',
      schema: 'public',
      filter: `user_id=eq.${user.id}`,
    } : undefined,
    enabled: !!user,
  });

  // Seed default stages if none exist
  useEffect(() => {
    const seedIfNeeded = async () => {
      if (!user || loading) return;
      
      // Check if stages exist
      if (stages.length === 0) {
        const { error } = await supabase.rpc('seed_default_lead_stages', {
          p_user_id: user.id,
        });
        
        if (error) {
          logger.error('Failed to seed default stages:', error);
        } else {
          refetch();
        }
      }
    };

    seedIfNeeded();
  }, [user, loading, stages.length, refetch]);

  // Create a new stage
  const createStage = useCallback(async (name: string, color: string = '#3b82f6') => {
    if (!user) return;

    const maxOrder = stages.reduce((max, s) => Math.max(max, s.order_index), -1);

    const { data, error } = await supabase
      .from('lead_stages')
      .insert({
        user_id: user.id,
        name,
        color,
        order_index: maxOrder + 1,
        is_default: stages.length === 0,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create stage');
      throw error;
    }

    queryClient.invalidateQueries({ queryKey: queryKeys.leadStages });
    toast.success('Stage created');
    return data as LeadStage;
  }, [user, stages, queryClient]);

  // Update an existing stage
  const updateStage = useCallback(async (id: string, updates: Partial<Pick<LeadStage, 'name' | 'color' | 'is_default'>>) => {
    // If setting as default, unset other defaults first
    if (updates.is_default) {
      const currentDefault = stages.find(s => s.is_default && s.id !== id);
      if (currentDefault) {
        await supabase
          .from('lead_stages')
          .update({ is_default: false })
          .eq('id', currentDefault.id);
      }
    }

    const { error } = await supabase
      .from('lead_stages')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update stage');
      throw error;
    }

    queryClient.invalidateQueries({ queryKey: queryKeys.leadStages });
  }, [stages, queryClient]);

  // Delete a stage (with lead count check)
  const deleteStage = useCallback(async (id: string) => {
    // Check if any leads use this stage
    const { count, error: countError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('stage_id', id);

    if (countError) {
      toast.error('Failed to check leads');
      throw countError;
    }

    if ((count ?? 0) > 0) {
      toast.error(`Cannot delete stage with ${count} lead(s). Move leads first.`);
      return false;
    }

    const { error } = await supabase
      .from('lead_stages')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete stage');
      throw error;
    }

    queryClient.invalidateQueries({ queryKey: queryKeys.leadStages });
    toast.success('Stage deleted');
    return true;
  }, [queryClient]);

  // Reorder stages
  const reorderStages = useCallback(async (orderedIds: string[]) => {
    const updates = orderedIds.map((id, index) => ({
      id,
      order_index: index,
    }));

    // Update each stage's order
    for (const update of updates) {
      const { error } = await supabase
        .from('lead_stages')
        .update({ order_index: update.order_index })
        .eq('id', update.id);

      if (error) {
        toast.error('Failed to reorder stages');
        throw error;
      }
    }

    queryClient.invalidateQueries({ queryKey: queryKeys.leadStages });
  }, [queryClient]);

  // Get lead count per stage
  const getLeadCountByStage = useCallback(async (stageId: string): Promise<number> => {
    const { count, error } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('stage_id', stageId);

    if (error) return 0;
    return count ?? 0;
  }, []);

  return {
    stages,
    loading,
    createStage,
    updateStage,
    deleteStage,
    reorderStages,
    getLeadCountByStage,
    refetch,
  };
}
