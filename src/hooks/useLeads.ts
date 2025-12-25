import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/types/errors';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { queryKeys } from '@/lib/query-keys';
import type { Tables, Enums } from '@/integrations/supabase/types';

type Lead = Tables<'leads'> & {
  conversations?: { id: string; created_at: string };
};

/**
 * Hook for managing leads captured from widget contact forms.
 * Uses React Query for caching and real-time Supabase subscriptions.
 * 
 * @returns {Object} Lead management methods and state
 * @returns {Lead[]} leads - List of user's leads with linked conversations
 * @returns {boolean} loading - Loading state (only true on initial load)
 * @returns {Function} createLead - Create a new lead
 * @returns {Function} updateLead - Update an existing lead
 * @returns {Function} updateLeadOrders - Batch update kanban order for drag-and-drop
 * @returns {Function} deleteLead - Delete a lead (optionally with linked conversation)
 * @returns {Function} deleteLeads - Bulk delete leads
 * @returns {Function} getLeadsWithConversations - Check if leads have linked conversations
 * @returns {Function} refetch - Manually refresh leads list
 */
export const useLeads = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch leads using React Query with real-time updates
  const { 
    data: leads = [], 
    isLoading: loading,
    refetch,
  } = useSupabaseQuery<Lead[]>({
    queryKey: queryKeys.leads.list(),
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('leads')
        .select('*, conversations!fk_leads_conversation(id, created_at)')
        .eq('user_id', user.id)
        .order('status')
        .order('kanban_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    realtime: user?.id ? {
      table: 'leads',
      filter: `user_id=eq.${user.id}`,
    } : undefined,
    enabled: !!user?.id,
    staleTime: 30_000, // Consider data fresh for 30 seconds
  });

  const createLead = async (leadData: Partial<Tables<'leads'>>) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('leads')
        .insert([{ ...leadData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Lead created', {
        description: 'Lead has been created successfully',
      });

      // Real-time subscription will refresh the list
      return data;
    } catch (error: unknown) {
      toast.error('Error creating lead', {
        description: getErrorMessage(error),
      });
      throw error;
    }
  };

  const updateLead = async (id: string, updates: Partial<Tables<'leads'>>) => {
    // Get the current lead to find conversation_id for sync
    const currentLead = leads.find(l => l.id === id);
    const previousLeads = queryClient.getQueryData<Lead[]>(queryKeys.leads.list());

    // Optimistically update cache immediately to prevent reverting
    queryClient.setQueryData<Lead[]>(queryKeys.leads.list(), (oldLeads) => {
      if (!oldLeads) return oldLeads;
      return oldLeads.map(lead => 
        lead.id === id ? { ...lead, ...updates } as Lead : lead
      );
    });

    try {
      const { error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Sync lead changes with conversation metadata if conversation exists
      if (currentLead?.conversation_id) {
        const metadataUpdates: Record<string, string | null> = {};
        
        if ('name' in updates) {
          metadataUpdates.lead_name = updates.name || null;
        }
        if ('email' in updates) {
          metadataUpdates.lead_email = updates.email || null;
        }
        if ('phone' in updates) {
          metadataUpdates.lead_phone = updates.phone || null;
        }
        
        if (Object.keys(metadataUpdates).length > 0) {
          // Get current conversation metadata and merge updates
          const { data: conversation } = await supabase
            .from('conversations')
            .select('metadata')
            .eq('id', currentLead.conversation_id)
            .single();
          
          if (conversation) {
            const currentMetadata = (conversation.metadata || {}) as Record<string, unknown>;
            const mergedMetadata = { ...currentMetadata, ...metadataUpdates } as Record<string, unknown>;
            await supabase
              .from('conversations')
              .update({ 
                metadata: mergedMetadata as unknown as Tables<'conversations'>['metadata']
              })
              .eq('id', currentLead.conversation_id);
            
            // Invalidate conversations cache to reflect changes
            queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
          }
        }
      }

      // Don't refetch since we already updated optimistically
    } catch (error: unknown) {
      // Revert on error
      if (previousLeads) {
        queryClient.setQueryData(queryKeys.leads.list(), previousLeads);
      }
      toast.error('Error updating lead', {
        description: getErrorMessage(error),
      });
      throw error;
    }
  };

  /**
   * Batch update kanban order for multiple leads (used for drag-and-drop reordering)
   * Optimistically updates local state, then persists to database
   */
  const updateLeadOrders = async (updates: { id: string; kanban_order: number; status?: Enums<'lead_status'> }[]) => {
    if (updates.length === 0) return;

    const previousLeads = queryClient.getQueryData<Lead[]>(queryKeys.leads.list());

    // Optimistically update cache
    queryClient.setQueryData<Lead[]>(queryKeys.leads.list(), (oldLeads) => {
      if (!oldLeads) return oldLeads;
      
      const updatesMap = new Map(updates.map(u => [u.id, u]));
      return oldLeads.map(lead => {
        const update = updatesMap.get(lead.id);
        if (update) {
          return { 
            ...lead, 
            kanban_order: update.kanban_order,
            status: update.status ?? lead.status,
          } as Lead;
        }
        return lead;
      });
    });

    try {
      // Batch update using Promise.all for efficiency
      const updatePromises = updates.map(({ id, kanban_order, status }) => 
        supabase
          .from('leads')
          .update({ kanban_order, ...(status && { status }) })
          .eq('id', id)
      );
      
      const results = await Promise.all(updatePromises);
      const firstError = results.find(r => r.error);
      if (firstError?.error) throw firstError.error;
      
      // Don't refetch - we already updated optimistically
    } catch (error: unknown) {
      // Revert on error
      if (previousLeads) {
        queryClient.setQueryData(queryKeys.leads.list(), previousLeads);
      }
      toast.error('Error updating lead order', {
        description: getErrorMessage(error),
      });
    }
  };

  const deleteLead = async (id: string, deleteConversation: boolean = false) => {
    try {
      // First, get the lead to find associated conversation
      const { data: lead } = await supabase
        .from('leads')
        .select('conversation_id')
        .eq('id', id)
        .single();

      // Delete conversation_memories for this lead
      await supabase
        .from('conversation_memories')
        .delete()
        .eq('lead_id', id);

      // Clear lead reference from calendar_events (keep the event)
      await supabase
        .from('calendar_events')
        .update({ lead_id: null })
        .eq('lead_id', id);

      // If deleteConversation is true and there's an associated conversation, delete it
      if (deleteConversation && lead?.conversation_id) {
        // Delete conversation_takeovers
        await supabase
          .from('conversation_takeovers')
          .delete()
          .eq('conversation_id', lead.conversation_id);

        // Delete conversation_ratings
        await supabase
          .from('conversation_ratings')
          .delete()
          .eq('conversation_id', lead.conversation_id);

        // Delete messages
        await supabase
          .from('messages')
          .delete()
          .eq('conversation_id', lead.conversation_id);

        // Clear conversation reference from calendar_events
        await supabase
          .from('calendar_events')
          .update({ conversation_id: null })
          .eq('conversation_id', lead.conversation_id);

        // Delete conversation_memories for this conversation
        await supabase
          .from('conversation_memories')
          .delete()
          .eq('conversation_id', lead.conversation_id);
        
        // Delete the conversation
        await supabase
          .from('conversations')
          .delete()
          .eq('id', lead.conversation_id);
      }

      // Finally delete the lead
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Lead deleted', {
        description: deleteConversation && lead?.conversation_id 
          ? 'Lead and all related data have been deleted'
          : 'Lead has been deleted successfully',
      });

      // Invalidate both leads and conversations caches
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
  };

  const deleteLeads = async (ids: string[], deleteConversations: boolean = false) => {
    if (ids.length === 0) return;
    
    try {
      // Get all leads to find associated conversations
      const { data: leadsToDelete } = await supabase
        .from('leads')
        .select('id, conversation_id')
        .in('id', ids);

      const conversationIds = (leadsToDelete
        ?.filter(l => l.conversation_id)
        .map(l => l.conversation_id) || []) as string[];

      // Delete conversation_memories for these leads
      await supabase
        .from('conversation_memories')
        .delete()
        .in('lead_id', ids);

      // Clear lead references from calendar_events
      await supabase
        .from('calendar_events')
        .update({ lead_id: null })
        .in('lead_id', ids);

      // If deleteConversations is true and there are associated conversations, delete them
      if (deleteConversations && conversationIds.length > 0) {
        // Delete conversation_takeovers
        await supabase
          .from('conversation_takeovers')
          .delete()
          .in('conversation_id', conversationIds);

        // Delete conversation_ratings
        await supabase
          .from('conversation_ratings')
          .delete()
          .in('conversation_id', conversationIds);

        // Delete messages
        await supabase
          .from('messages')
          .delete()
          .in('conversation_id', conversationIds);

        // Clear conversation references from calendar_events
        await supabase
          .from('calendar_events')
          .update({ conversation_id: null })
          .in('conversation_id', conversationIds);

        // Delete conversation_memories for these conversations
        await supabase
          .from('conversation_memories')
          .delete()
          .in('conversation_id', conversationIds);
        
        // Delete the conversations
        await supabase
          .from('conversations')
          .delete()
          .in('id', conversationIds);
      }

      // Finally delete the leads
      const { error } = await supabase
        .from('leads')
        .delete()
        .in('id', ids);

      if (error) throw error;

      const conversationText = deleteConversations && conversationIds.length > 0
        ? ` and ${conversationIds.length} conversation${conversationIds.length > 1 ? 's' : ''}`
        : '';

      toast.success(`${ids.length} lead${ids.length > 1 ? 's' : ''}${conversationText} deleted`, {
        description: 'All related data has been cleaned up',
      });

      // Invalidate both leads and conversations caches
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
  };

  // Helper to check if any of the provided lead IDs have conversations
  const getLeadsWithConversations = useCallback((ids: string[]): boolean => {
    return leads.some(lead => ids.includes(lead.id) && lead.conversation_id);
  }, [leads]);

  return {
    leads,
    loading,
    createLead,
    updateLead,
    updateLeadOrders,
    deleteLead,
    deleteLeads,
    getLeadsWithConversations,
    refetch,
  };
};
