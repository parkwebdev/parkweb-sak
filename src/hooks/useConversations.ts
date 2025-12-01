import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/lib/toast';
import type { Tables } from '@/integrations/supabase/types';

type Conversation = Tables<'conversations'> & {
  agents?: { name: string };
  message_count?: number;
};

type Message = Tables<'messages'>;

export const useConversations = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          agents(name)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();

    // Set up real-time subscription
    if (!user?.id) return;

    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchMessages = async (conversationId: string): Promise<Message[]> => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
      return [];
    }
  };

  const updateConversationStatus = async (
    id: string, 
    status: 'active' | 'human_takeover' | 'closed'
  ) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(`Conversation ${status === 'human_takeover' ? 'taken over' : status}`);
      await fetchConversations();
    } catch (error) {
      console.error('Error updating conversation:', error);
      toast.error('Failed to update conversation');
    }
  };

  const takeover = async (conversationId: string, reason?: string) => {
    if (!user?.id) return;

    try {
      const { error: takeoverError } = await supabase
        .from('conversation_takeovers')
        .insert({
          conversation_id: conversationId,
          taken_over_by: user.id,
          reason: reason || 'Manual takeover'
        });

      if (takeoverError) throw takeoverError;

      await updateConversationStatus(conversationId, 'human_takeover');
    } catch (error) {
      console.error('Error taking over conversation:', error);
      toast.error('Failed to take over conversation');
    }
  };

  const returnToAI = async (conversationId: string) => {
    try {
      // Find active takeover
      const { data: takeovers, error: fetchError } = await supabase
        .from('conversation_takeovers')
        .select('id')
        .eq('conversation_id', conversationId)
        .is('returned_to_ai_at', null)
        .single();

      if (fetchError) throw fetchError;

      if (takeovers) {
        const { error: updateError } = await supabase
          .from('conversation_takeovers')
          .update({ returned_to_ai_at: new Date().toISOString() })
          .eq('id', takeovers.id);

        if (updateError) throw updateError;
      }

      await updateConversationStatus(conversationId, 'active');
    } catch (error) {
      console.error('Error returning to AI:', error);
      toast.error('Failed to return to AI');
    }
  };

  return {
    conversations,
    loading,
    fetchMessages,
    updateConversationStatus,
    takeover,
    returnToAI,
    refetch: fetchConversations,
  };
};
