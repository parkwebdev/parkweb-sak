/**
 * Infinite Scroll Leads Hook
 * 
 * Implements cursor-based pagination with infinite scroll for leads.
 * Uses usePaginatedQuery foundation for efficient data loading.
 * 
 * @module hooks/useInfiniteLeads
 * @see docs/DEVELOPMENT_STANDARDS.md
 */

import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAccountOwnerId } from '@/hooks/useAccountOwnerId';
import { useAuth } from '@/hooks/useAuth';
import { usePaginatedQuery, flattenPages, DEFAULT_PAGE_SIZE } from '@/hooks/usePaginatedQuery';
import { queryKeys } from '@/lib/query-keys';
import { RealtimeManager } from '@/lib/realtime-manager';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/types/errors';
import type { Tables, Enums } from '@/integrations/supabase/types';

type Lead = Tables<'leads'> & {
  conversations?: { id: string; created_at: string; metadata?: unknown } | null;
};

/** Page size for infinite scroll */
const LEADS_PAGE_SIZE = 25;

/** Options for useInfiniteLeads */
export interface UseInfiniteLeadsOptions {
  /** Enable/disable the query */
  enabled?: boolean;
}

/**
 * Hook for infinite scroll leads with cursor-based pagination.
 * 
 * @example
 * ```tsx
 * const { 
 *   leads, 
 *   isLoading, 
 *   hasNextPage, 
 *   fetchNextPage, 
 *   isFetchingNextPage 
 * } = useInfiniteLeads();
 * 
 * // Trigger load more
 * const handleLoadMore = () => {
 *   if (hasNextPage && !isFetchingNextPage) {
 *     fetchNextPage();
 *   }
 * };
 * ```
 */
export function useInfiniteLeads(options: UseInfiniteLeadsOptions = {}) {
  const { enabled = true } = options;
  const { user } = useAuth();
  const { accountOwnerId, loading: ownerLoading } = useAccountOwnerId();
  const queryClient = useQueryClient();

  // Infinite query for leads
  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = usePaginatedQuery<Lead>({
    queryKey: [...queryKeys.leads.list({ ownerId: accountOwnerId }), 'infinite'],
    queryFn: async (cursor) => {
      if (!accountOwnerId) {
        return { data: [], nextCursor: null };
      }

      let query = supabase
        .from('leads')
        .select('*, conversations!fk_leads_conversation(id, created_at, metadata)')
        .eq('user_id', accountOwnerId)
        .order('created_at', { ascending: false })
        .limit(LEADS_PAGE_SIZE);

      // Cursor-based pagination using created_at
      if (cursor) {
        query = query.lt('created_at', cursor);
      }

      const { data: leads, error } = await query;

      if (error) throw error;

      const items = leads || [];
      const nextCursor = items.length === LEADS_PAGE_SIZE 
        ? items[items.length - 1]?.created_at 
        : null;

      return {
        data: items,
        nextCursor,
      };
    },
    enabled: enabled && !!accountOwnerId && !ownerLoading,
    staleTime: 30_000,
  });

  // Set up real-time subscription via RealtimeManager
  useEffect(() => {
    if (!accountOwnerId) return;

    const unsubscribe = RealtimeManager.subscribe(
      {
        table: 'leads',
        filter: `user_id=eq.${accountOwnerId}`,
      },
      (payload) => {
        // Invalidate on any change to refresh the list
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.leads.all 
        });
      },
      accountOwnerId
    );

    return unsubscribe;
  }, [accountOwnerId, queryClient]);

  // Flatten pages into single array
  const leads = flattenPages(data);

  // CRUD operations - delegating to useLeads for mutations
  // These maintain the same API as useLeads for compatibility

  const createLead = useCallback(async (leadData: Partial<Tables<'leads'>>) => {
    if (!accountOwnerId) return;

    try {
      const { data, error } = await supabase
        .from('leads')
        .insert([{ ...leadData, user_id: accountOwnerId }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Lead created', {
        description: 'Lead has been created successfully',
      });

      // Invalidate to refetch
      await queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
      return data;
    } catch (error: unknown) {
      toast.error('Error creating lead', {
        description: getErrorMessage(error),
      });
      throw error;
    }
  }, [accountOwnerId, queryClient]);

  const updateLead = useCallback(async (id: string, updates: Partial<Tables<'leads'>>) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Real-time will handle cache update
    } catch (error: unknown) {
      toast.error('Error updating lead', {
        description: getErrorMessage(error),
      });
      throw error;
    }
  }, []);

  const updateLeadOrders = useCallback(async (
    updates: { id: string; kanban_order: number; status?: Enums<'lead_status'>; stage_id?: string }[]
  ) => {
    if (updates.length === 0) return;

    try {
      const { error } = await supabase.rpc('batch_update_lead_orders', {
        updates: JSON.stringify(updates.map(({ id, kanban_order, status, stage_id }) => ({
          id,
          kanban_order,
          ...(status && { status }),
          ...(stage_id && { stage_id }),
        }))),
      });

      if (error) throw error;
    } catch (error: unknown) {
      toast.error('Error updating lead order', {
        description: getErrorMessage(error),
      });
    }
  }, []);

  const deleteLead = useCallback(async (id: string, deleteConversation: boolean = false) => {
    try {
      const { data: lead } = await supabase
        .from('leads')
        .select('conversation_id')
        .eq('id', id)
        .single();

      // Delete related data
      await supabase.from('conversation_memories').delete().eq('lead_id', id);
      await supabase.from('calendar_events').update({ lead_id: null }).eq('lead_id', id);

      if (deleteConversation && lead?.conversation_id) {
        await supabase.from('conversation_takeovers').delete().eq('conversation_id', lead.conversation_id);
        await supabase.from('conversation_ratings').delete().eq('conversation_id', lead.conversation_id);
        await supabase.from('messages').delete().eq('conversation_id', lead.conversation_id);
        await supabase.from('calendar_events').update({ conversation_id: null }).eq('conversation_id', lead.conversation_id);
        await supabase.from('conversation_memories').delete().eq('conversation_id', lead.conversation_id);
        await supabase.from('conversations').delete().eq('id', lead.conversation_id);
      }

      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;

      toast.success('Lead deleted', {
        description: deleteConversation && lead?.conversation_id 
          ? 'Lead and all related data have been deleted'
          : 'Lead has been deleted successfully',
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.leads.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all }),
      ]);
    } catch (error: unknown) {
      toast.error('Error deleting lead', {
        description: getErrorMessage(error),
      });
      throw error;
    }
  }, [queryClient]);

  const deleteLeads = useCallback(async (ids: string[], deleteConversations: boolean = false) => {
    if (ids.length === 0) return;

    try {
      const { data: leadsToDelete } = await supabase
        .from('leads')
        .select('id, conversation_id')
        .in('id', ids);

      const conversationIds = (leadsToDelete
        ?.filter(l => l.conversation_id)
        .map(l => l.conversation_id) || []) as string[];

      await supabase.from('conversation_memories').delete().in('lead_id', ids);
      await supabase.from('calendar_events').update({ lead_id: null }).in('lead_id', ids);

      if (deleteConversations && conversationIds.length > 0) {
        await supabase.from('conversation_takeovers').delete().in('conversation_id', conversationIds);
        await supabase.from('conversation_ratings').delete().in('conversation_id', conversationIds);
        await supabase.from('messages').delete().in('conversation_id', conversationIds);
        await supabase.from('calendar_events').update({ conversation_id: null }).in('conversation_id', conversationIds);
        await supabase.from('conversation_memories').delete().in('conversation_id', conversationIds);
        await supabase.from('conversations').delete().in('id', conversationIds);
      }

      const { error } = await supabase.from('leads').delete().in('id', ids);
      if (error) throw error;

      const conversationText = deleteConversations && conversationIds.length > 0
        ? ` and ${conversationIds.length} conversation${conversationIds.length > 1 ? 's' : ''}`
        : '';

      toast.success(`${ids.length} lead${ids.length > 1 ? 's' : ''}${conversationText} deleted`, {
        description: 'All related data has been cleaned up',
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.leads.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all }),
      ]);
    } catch (error: unknown) {
      toast.error('Error deleting leads', {
        description: getErrorMessage(error),
      });
      throw error;
    }
  }, [queryClient]);

  const getLeadsWithConversations = useCallback((ids: string[]): boolean => {
    return leads.some(lead => ids.includes(lead.id) && lead.conversation_id);
  }, [leads]);

  return {
    leads,
    loading: isLoading || ownerLoading,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,
    fetchNextPage,
    refetch,
    // CRUD operations
    createLead,
    updateLead,
    updateLeadOrders,
    deleteLead,
    deleteLeads,
    getLeadsWithConversations,
  };
}
