import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';
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
      logger.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();

    // Set up real-time subscription
    if (!user?.id) return;

    const conversationsChannel = supabase
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

    // Subscribe to new messages for instant updates
    const messagesChannel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => {
          // Refetch conversations to update last message preview
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(messagesChannel);
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
      logger.error('Error fetching messages:', error);
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
      logger.error('Error updating conversation:', error);
      toast.error('Failed to update conversation');
    }
  };

  const updateConversationMetadata = async (
    conversationId: string,
    metadata: Record<string, any>
  ) => {
    try {
      // First fetch current conversation to merge metadata
      const { data: current, error: fetchError } = await supabase
        .from('conversations')
        .select('metadata')
        .eq('id', conversationId)
        .single();

      if (fetchError) throw fetchError;

      const mergedMetadata = {
        ...(current?.metadata as Record<string, any> || {}),
        ...metadata,
      };

      const { error } = await supabase
        .from('conversations')
        .update({ metadata: mergedMetadata })
        .eq('id', conversationId);

      if (error) throw error;
      
      // Update local state
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, metadata: mergedMetadata }
            : conv
        )
      );
      
      toast.success('Updated successfully');
    } catch (error) {
      logger.error('Error updating conversation metadata:', error);
      toast.error('Failed to update');
      throw error;
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
      logger.error('Error taking over conversation:', error);
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
      logger.error('Error returning to AI:', error);
      toast.error('Failed to return to AI');
    }
  };

  const reopenConversation = async (conversationId: string) => {
    try {
      await updateConversationStatus(conversationId, 'human_takeover');
      toast.success('Conversation re-opened - you can now respond');
    } catch (error) {
      logger.error('Error re-opening conversation:', error);
      toast.error('Failed to re-open conversation');
    }
  };

  const sendHumanMessage = async (conversationId: string, content: string): Promise<boolean> => {
    if (!user?.id) {
      toast.error('You must be logged in to send messages');
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-human-message', {
        body: {
          conversationId,
          content,
          senderId: user.id,
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      return true;
    } catch (error) {
      logger.error('Error sending human message:', error);
      toast.error('Failed to send message');
      return false;
    }
  };

  return {
    conversations,
    loading,
    fetchMessages,
    updateConversationStatus,
    updateConversationMetadata,
    takeover,
    returnToAI,
    sendHumanMessage,
    reopenConversation,
    refetch: fetchConversations,
  };
};
