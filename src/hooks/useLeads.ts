import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/types/errors';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';

type Lead = Tables<'leads'> & {
  conversations?: { id: string; created_at: string };
};

/**
 * Hook for managing leads captured from widget contact forms.
 * Provides CRUD operations with real-time updates and conversation linkage.
 * 
 * @returns {Object} Lead management methods and state
 * @returns {Lead[]} leads - List of user's leads with linked conversations
 * @returns {boolean} loading - Loading state
 * @returns {Function} createLead - Create a new lead
 * @returns {Function} updateLead - Update an existing lead
 * @returns {Function} deleteLead - Delete a lead (optionally with linked conversation)
 * @returns {Function} deleteLeads - Bulk delete leads
 * @returns {Function} getLeadsWithConversations - Check if leads have linked conversations
 * @returns {Function} refetch - Manually refresh leads list
 */
export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchLeads = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*, conversations(id, created_at)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error: unknown) {
      toast.error('Error fetching leads', {
        description: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const createLead = async (leadData: Partial<Tables<'leads'>>) => {
    if (!user?.id) return;

    try {
      const { data, error} = await supabase
        .from('leads')
        .insert([{ ...leadData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Lead created', {
        description: 'Lead has been created successfully',
      });

      fetchLeads();
      return data;
    } catch (error: unknown) {
      toast.error('Error creating lead', {
        description: getErrorMessage(error),
      });
      throw error;
    }
  };

  const updateLead = async (id: string, updates: Partial<Tables<'leads'>>) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Success - no toast needed (SavedIndicator shows feedback for status changes)
      fetchLeads();
    } catch (error: unknown) {
      toast.error('Error updating lead', {
        description: getErrorMessage(error),
      });
      throw error;
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

      // Delete the lead first
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // If deleteConversation is true and there's an associated conversation, delete it
      if (deleteConversation && lead?.conversation_id) {
        // Delete messages first (foreign key constraint)
        await supabase
          .from('messages')
          .delete()
          .eq('conversation_id', lead.conversation_id);
        
        // Then delete the conversation
        await supabase
          .from('conversations')
          .delete()
          .eq('id', lead.conversation_id);
      }

      toast.success('Lead deleted', {
        description: deleteConversation && lead?.conversation_id 
          ? 'Lead and conversation have been deleted successfully'
          : 'Lead has been deleted successfully',
      });

      fetchLeads();
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

      const conversationIds = leadsToDelete
        ?.filter(l => l.conversation_id)
        .map(l => l.conversation_id) || [];

      // Delete the leads first
      const { error } = await supabase
        .from('leads')
        .delete()
        .in('id', ids);

      if (error) throw error;

      // If deleteConversations is true and there are associated conversations, delete them
      if (deleteConversations && conversationIds.length > 0) {
        // Delete messages first (foreign key constraint)
        await supabase
          .from('messages')
          .delete()
          .in('conversation_id', conversationIds);
        
        // Then delete the conversations
        await supabase
          .from('conversations')
          .delete()
          .in('id', conversationIds);
      }

      const conversationText = deleteConversations && conversationIds.length > 0
        ? ` and ${conversationIds.length} conversation${conversationIds.length > 1 ? 's' : ''}`
        : '';

      toast.success(`${ids.length} lead${ids.length > 1 ? 's' : ''}${conversationText} deleted`, {
        description: 'Selected items have been deleted successfully',
      });

      fetchLeads();
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

  useEffect(() => {
    fetchLeads();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    leads,
    loading,
    createLead,
    updateLead,
    deleteLead,
    deleteLeads,
    getLeadsWithConversations,
    refetch: fetchLeads,
  };
};
