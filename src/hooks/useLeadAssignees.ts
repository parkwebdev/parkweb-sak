/**
 * @fileoverview Hook for managing lead assignees (multi-assignee support).
 * Provides CRUD operations with optimistic updates.
 */

import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface LeadAssignee {
  id: string;
  lead_id: string;
  user_id: string;
  assigned_at: string;
  assigned_by: string | null;
}

interface UseLeadAssigneesReturn {
  /** Map of lead_id to array of user_ids */
  assigneesByLead: Record<string, string[]>;
  /** Get assignees for a specific lead */
  getAssignees: (leadId: string) => string[];
  /** Add an assignee to a lead */
  addAssignee: (leadId: string, userId: string) => Promise<void>;
  /** Remove an assignee from a lead */
  removeAssignee: (leadId: string, userId: string) => Promise<void>;
  /** Loading state */
  loading: boolean;
}

export function useLeadAssignees(): UseLeadAssigneesReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['lead-assignees', user?.id];

  // Fetch all assignees for accessible leads
  const { data: assignees = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_assignees')
        .select('*')
        .order('assigned_at', { ascending: true });

      if (error) throw error;
      return data as LeadAssignee[];
    },
    enabled: !!user,
    staleTime: 30000,
  });

  // Build map of lead_id -> user_id[]
  const assigneesByLead = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const a of assignees) {
      if (!map[a.lead_id]) {
        map[a.lead_id] = [];
      }
      map[a.lead_id].push(a.user_id);
    }
    return map;
  }, [assignees]);

  // Get assignees for a specific lead
  const getAssignees = useCallback(
    (leadId: string): string[] => assigneesByLead[leadId] || [],
    [assigneesByLead]
  );

  // Add assignee mutation
  const addMutation = useMutation({
    mutationFn: async ({ leadId, userId }: { leadId: string; userId: string }) => {
      const { error } = await supabase.from('lead_assignees').insert({
        lead_id: leadId,
        user_id: userId,
        assigned_by: user?.id,
      });
      if (error) throw error;
    },
    onMutate: async ({ leadId, userId }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<LeadAssignee[]>(queryKey);

      // Optimistic update
      queryClient.setQueryData<LeadAssignee[]>(queryKey, (old = []) => [
        ...old,
        {
          id: `temp-${Date.now()}`,
          lead_id: leadId,
          user_id: userId,
          assigned_at: new Date().toISOString(),
          assigned_by: user?.id || null,
        },
      ]);

      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error('Failed to add assignee');
      console.error('Add assignee error:', err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Remove assignee mutation
  const removeMutation = useMutation({
    mutationFn: async ({ leadId, userId }: { leadId: string; userId: string }) => {
      const { error } = await supabase
        .from('lead_assignees')
        .delete()
        .eq('lead_id', leadId)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onMutate: async ({ leadId, userId }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<LeadAssignee[]>(queryKey);

      // Optimistic update
      queryClient.setQueryData<LeadAssignee[]>(queryKey, (old = []) =>
        old.filter((a) => !(a.lead_id === leadId && a.user_id === userId))
      );

      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error('Failed to remove assignee');
      console.error('Remove assignee error:', err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const addAssignee = useCallback(
    async (leadId: string, userId: string) => {
      await addMutation.mutateAsync({ leadId, userId });
    },
    [addMutation]
  );

  const removeAssignee = useCallback(
    async (leadId: string, userId: string) => {
      await removeMutation.mutateAsync({ leadId, userId });
    },
    [removeMutation]
  );

  return {
    assigneesByLead,
    getAssignees,
    addAssignee,
    removeAssignee,
    loading: isLoading,
  };
}
