import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';
import { playNotificationSound } from '@/lib/notification-sound';
import type { Tables } from '@/integrations/supabase/types';
import type { NotificationPreferencesData, ConversationMetadata } from '@/types/metadata';

type Conversation = Tables<'conversations'> & {
  agents?: { name: string };
  message_count?: number;
};

type Message = Tables<'messages'>;

/**
 * Hook for managing chat conversations.
 * Handles conversation CRUD, messages, human takeover, and real-time updates.
 * Plays notification sounds for new user messages when enabled.
 * 
 * @returns {Object} Conversation management methods and state
 * @returns {Conversation[]} conversations - List of user's conversations
 * @returns {boolean} loading - Loading state
 * @returns {Function} fetchMessages - Fetch messages for a conversation
 * @returns {Function} updateConversationStatus - Change conversation status
 * @returns {Function} updateConversationMetadata - Update conversation metadata (tags, notes, etc.)
 * @returns {Function} takeover - Take over a conversation from AI
 * @returns {Function} returnToAI - Return conversation control to AI
 * @returns {Function} sendHumanMessage - Send a message as a team member
 * @returns {Function} reopenConversation - Reopen a closed conversation
 * @returns {Function} refetch - Manually refresh conversations list
 */
export const useConversations = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const soundEnabledRef = useRef<boolean>(true);

  // Fetch user's sound notification preference
  const fetchSoundPreference = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data } = await supabase
        .from('notification_preferences')
        .select('sound_notifications')
        .eq('user_id', user.id)
        .single();
      
      soundEnabledRef.current = data?.sound_notifications !== false;
    } catch {
      // Default to enabled if fetch fails
      soundEnabledRef.current = true;
    }
  }, [user?.id]);

  const fetchConversations = async (showLoading = true) => {
    if (!user?.id) return;
    
    if (showLoading) setLoading(true);
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
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchSoundPreference();

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
          fetchConversations(false);
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
        (payload) => {
          const newMessage = payload.new as Message;
          
          // Play notification sound for user messages only (if sound enabled)
          if (newMessage.role === 'user' && soundEnabledRef.current) {
            playNotificationSound();
          }
          
          // Instant refetch - no artificial delay
          fetchConversations(false);
        }
      )
      .subscribe();

    // Subscribe to notification preference changes
    const prefsChannel = supabase
      .channel('notification-prefs-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notification_preferences',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newPrefs = payload.new as NotificationPreferencesData;
          soundEnabledRef.current = newPrefs?.sound_notifications !== false;
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(prefsChannel);
    };
  }, [user?.id, fetchSoundPreference]);

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
    metadata: Record<string, any>,
    options?: { silent?: boolean }
  ) => {
    try {
      // First fetch current conversation to merge metadata
      const { data: current, error: fetchError } = await supabase
        .from('conversations')
        .select('metadata')
        .eq('id', conversationId)
        .single();

      if (fetchError) throw fetchError;

      const currentMetadata = (current?.metadata || {}) as Record<string, unknown>;
      const mergedMetadata = {
        ...currentMetadata,
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
            ? { ...conv, metadata: mergedMetadata as typeof conv.metadata }
            : conv
        )
      );
      
      if (!options?.silent) {
        toast.success('Updated successfully');
      }
    } catch (error) {
      logger.error('Error updating conversation metadata:', error);
      toast.error('Failed to update');
      throw error;
    }
  };

  const takeover = async (conversationId: string, reason?: string) => {
    if (!user?.id) return;

    try {
      // Get conversation details for notification
      const { data: conversation } = await supabase
        .from('conversations')
        .select('metadata, agents(name, user_id)')
        .eq('id', conversationId)
        .single();

      const { error: takeoverError } = await supabase
        .from('conversation_takeovers')
        .insert({
          conversation_id: conversationId,
          taken_over_by: user.id,
          reason: reason || 'Manual takeover'
        });

      if (takeoverError) throw takeoverError;

      await updateConversationStatus(conversationId, 'human_takeover');

      // Create notification for account owner about human takeover request
      if (conversation?.agents?.user_id) {
        const leadName = (conversation.metadata as ConversationMetadata)?.lead_name || 'A visitor';
        await supabase.from('notifications').insert({
          user_id: conversation.agents.user_id,
          type: 'conversation',
          title: 'Human Takeover Started',
          message: `${leadName}'s conversation requires attention`,
          data: { conversation_id: conversationId, taken_over_by: user.id },
          read: false
        });
      }
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

  const sendHumanMessage = async (conversationId: string, content: string, files?: File[]): Promise<boolean> => {
    if (!user?.id) {
      toast.error('You must be logged in to send messages');
      return false;
    }

    try {
      // Upload files to storage first if any
      let uploadedFiles: { name: string; url: string; type: string; size: number }[] = [];
      
      if (files && files.length > 0) {
        const uploadPromises = files.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${conversationId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('conversation-files')
            .upload(fileName, file);
          
          if (uploadError) throw uploadError;
          
          const { data: publicUrl } = supabase.storage
            .from('conversation-files')
            .getPublicUrl(fileName);
          
          return {
            name: file.name,
            url: publicUrl.publicUrl,
            type: file.type,
            size: file.size,
          };
        });
        
        uploadedFiles = await Promise.all(uploadPromises);
      }

      const { data, error } = await supabase.functions.invoke('send-human-message', {
        body: {
          conversationId,
          content: content || (uploadedFiles.length > 0 ? `Sent ${uploadedFiles.length} file(s)` : ''),
          senderId: user.id,
          files: uploadedFiles.length > 0 ? uploadedFiles : undefined,
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
