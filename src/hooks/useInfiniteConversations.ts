/**
 * Infinite Scroll Conversations Hook
 * 
 * Implements cursor-based pagination with infinite scroll for conversations.
 * Uses usePaginatedQuery foundation for efficient data loading.
 * 
 * @module hooks/useInfiniteConversations
 * @see docs/DEVELOPMENT_STANDARDS.md
 */

import { useCallback, useEffect, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAccountOwnerId } from '@/hooks/useAccountOwnerId';
import { useAuth } from '@/hooks/useAuth';
import { usePaginatedQuery, flattenPages } from '@/hooks/usePaginatedQuery';
import { queryKeys } from '@/lib/query-keys';
import { RealtimeManager } from '@/lib/realtime-manager';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';
import { playNotificationSound } from '@/lib/notification-sound';
import type { Tables, Json } from '@/integrations/supabase/types';
import type { ConversationMetadata, NotificationPreferencesData } from '@/types/metadata';

type Conversation = Tables<'conversations'> & {
  agents?: { name: string };
  message_count?: number;
  active_takeover?: {
    taken_over_by: string;
    profiles: {
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
};

type Message = Tables<'messages'>;

/** Page size for infinite scroll */
const CONVERSATIONS_PAGE_SIZE = 25;

/** Options for useInfiniteConversations */
export interface UseInfiniteConversationsOptions {
  /** Enable/disable the query */
  enabled?: boolean;
}

/**
 * Hook for infinite scroll conversations with cursor-based pagination.
 * Includes real-time updates and notification sounds.
 * 
 * @example
 * ```tsx
 * const { 
 *   conversations, 
 *   isLoading, 
 *   hasNextPage, 
 *   fetchNextPage,
 *   takeover,
 *   sendHumanMessage,
 * } = useInfiniteConversations();
 * ```
 */
export function useInfiniteConversations(options: UseInfiniteConversationsOptions = {}) {
  const { enabled = true } = options;
  const { user } = useAuth();
  const { accountOwnerId, loading: ownerLoading } = useAccountOwnerId();
  const queryClient = useQueryClient();
  const soundEnabledRef = useRef<boolean>(true);

  // Infinite query for conversations
  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = usePaginatedQuery<Conversation>({
    queryKey: [...queryKeys.conversations.list({ ownerId: accountOwnerId }), 'infinite'],
    queryFn: async (cursor) => {
      if (!accountOwnerId) {
        return { data: [], nextCursor: null };
      }

      let query = supabase
        .from('conversations')
        .select(`
          *,
          agents!fk_conversations_agent(name),
          conversation_takeovers(
            taken_over_by,
            returned_to_ai_at
          )
        `)
        .eq('user_id', accountOwnerId)
        .order('updated_at', { ascending: false })
        .limit(CONVERSATIONS_PAGE_SIZE);

      // Cursor-based pagination using updated_at
      if (cursor) {
        query = query.lt('updated_at', cursor);
      }

      const { data: convData, error } = await query;
      if (error) throw error;
      if (!convData) return { data: [], nextCursor: null };

      // Get unique user IDs from active takeovers to fetch profiles
      const activeTakeoverUserIds = new Set<string>();
      convData.forEach(conv => {
        const takeovers = conv.conversation_takeovers as Array<{
          taken_over_by: string;
          returned_to_ai_at: string | null;
        }> | null;
        const active = takeovers?.find(t => t.returned_to_ai_at === null);
        if (active) {
          activeTakeoverUserIds.add(active.taken_over_by);
        }
      });

      // Fetch profiles for takeover users
      let profilesMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
      if (activeTakeoverUserIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', Array.from(activeTakeoverUserIds));

        if (profiles) {
          profilesMap = Object.fromEntries(
            profiles.map(p => [p.user_id, { display_name: p.display_name, avatar_url: p.avatar_url }])
          );
        }
      }

      // Process to extract active takeover with profile info
      const items = convData.map(conv => {
        const takeovers = conv.conversation_takeovers as Array<{
          taken_over_by: string;
          returned_to_ai_at: string | null;
        }> | null;

        const activeTakeover = takeovers?.find(t => t.returned_to_ai_at === null);

        return {
          ...conv,
          active_takeover: activeTakeover ? {
            taken_over_by: activeTakeover.taken_over_by,
            profiles: profilesMap[activeTakeover.taken_over_by] || null,
          } : null,
          conversation_takeovers: undefined,
        };
      });

      const nextCursor = items.length === CONVERSATIONS_PAGE_SIZE
        ? items[items.length - 1]?.updated_at
        : null;

      return {
        data: items,
        nextCursor,
      };
    },
    enabled: enabled && !!accountOwnerId && !ownerLoading,
    staleTime: 30_000,
  });

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
      soundEnabledRef.current = true;
    }
  }, [user?.id]);

  // Set up real-time subscriptions via RealtimeManager
  useEffect(() => {
    if (!accountOwnerId || !user?.id) return;

    fetchSoundPreference();

    // Subscribe to conversation changes
    const unsubConversations = RealtimeManager.subscribe(
      {
        table: 'conversations',
        filter: `user_id=eq.${accountOwnerId}`,
      },
      () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
      },
      accountOwnerId
    );

    // Subscribe to new messages for notifications
    const unsubMessages = RealtimeManager.subscribe(
      {
        table: 'messages',
        event: 'INSERT',
      },
      (payload) => {
        const newMessage = payload.new as Message;

        // Play notification sound for user messages only
        if (newMessage.role === 'user' && soundEnabledRef.current) {
          playNotificationSound();
        }

        // Invalidate conversations to update metadata
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
      },
      accountOwnerId
    );

    // Subscribe to notification preference changes
    const unsubPrefs = RealtimeManager.subscribe(
      {
        table: 'notification_preferences',
        filter: `user_id=eq.${user.id}`,
        event: 'UPDATE',
      },
      (payload) => {
        const newPrefs = payload.new as NotificationPreferencesData;
        soundEnabledRef.current = newPrefs?.sound_notifications !== false;
      },
      user.id
    );

    return () => {
      unsubConversations();
      unsubMessages();
      unsubPrefs();
    };
  }, [accountOwnerId, user?.id, queryClient, fetchSoundPreference]);

  // Flatten pages into single array - memoized to prevent unnecessary re-renders
  const conversations = useMemo(() => flattenPages(data), [data]);

  /**
   * Fetch messages for a conversation with optional cursor-based pagination.
   * Supports loading older messages for infinite scroll.
   * 
   * @param conversationId - The conversation to fetch messages for
   * @param options - Pagination options
   * @param options.cursor - Load messages older than this timestamp
   * @param options.limit - Number of messages to fetch (default: 50)
   * @returns Messages and pagination info
   */
  const fetchMessages = useCallback(async (
    conversationId: string,
    options?: { cursor?: string; limit?: number }
  ): Promise<Message[]> => {
    const limit = options?.limit ?? 50;
    
    try {
      let query = supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          role,
          content,
          created_at,
          metadata,
          tool_arguments,
          tool_call_id,
          tool_name,
          tool_result
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Cursor-based pagination for loading older messages
      if (options?.cursor) {
        query = query.lt('created_at', options.cursor);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Return in chronological order (oldest first)
      return (data || []).reverse();
    } catch (error: unknown) {
      logger.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
      return [];
    }
  }, []);

  // Update conversation status
  const updateConversationStatus = useCallback(async (
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
      await queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
    } catch (error: unknown) {
      logger.error('Error updating conversation:', error);
      toast.error('Failed to update conversation');
    }
  }, [queryClient]);

  // Update conversation metadata
  const updateConversationMetadata = useCallback(async (
    conversationId: string,
    metadata: Partial<ConversationMetadata> | Record<string, unknown>,
    options?: { silent?: boolean }
  ) => {
    try {
      const { data: current, error: fetchError } = await supabase
        .from('conversations')
        .select('metadata')
        .eq('id', conversationId)
        .single();

      if (fetchError) throw fetchError;

      const currentMetadata = (current?.metadata || {}) as Record<string, unknown>;
      const mergedMetadata = { ...currentMetadata, ...metadata };

      const { error } = await supabase
        .from('conversations')
        .update({ metadata: mergedMetadata as Json })
        .eq('id', conversationId);

      if (error) throw error;

      if (!options?.silent) {
        toast.success('Updated successfully');
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
    } catch (error: unknown) {
      logger.error('Error updating conversation metadata:', error);
      toast.error('Failed to update');
      throw error;
    }
  }, [queryClient]);

  // Take over a conversation
  const takeover = useCallback(async (conversationId: string, reason?: string) => {
    if (!user?.id) return;

    try {
      const { data: conversation } = await supabase
        .from('conversations')
        .select('metadata, agents!fk_conversations_agent(name, user_id)')
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
    } catch (error: unknown) {
      logger.error('Error taking over conversation:', error);
      toast.error('Failed to take over conversation');
    }
  }, [user?.id, updateConversationStatus]);

  // Return to AI
  const returnToAI = useCallback(async (conversationId: string) => {
    try {
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
    } catch (error: unknown) {
      logger.error('Error returning to AI:', error);
      toast.error('Failed to return to AI');
    }
  }, [updateConversationStatus]);

  // Reopen conversation
  const reopenConversation = useCallback(async (conversationId: string) => {
    try {
      await updateConversationStatus(conversationId, 'human_takeover');
      toast.success('Conversation re-opened - you can now respond');
    } catch (error: unknown) {
      logger.error('Error re-opening conversation:', error);
      toast.error('Failed to re-open conversation');
    }
  }, [updateConversationStatus]);

  // Send human message
  const sendHumanMessage = useCallback(async (
    conversationId: string,
    content: string,
    files?: File[]
  ): Promise<boolean> => {
    if (!user?.id) {
      toast.error('You must be logged in to send messages');
      return false;
    }

    try {
      let uploadedFiles: { name: string; url: string; type: string; size: number }[] = [];

      if (files && files.length > 0) {
        const uploadPromises = files.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${conversationId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
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
      if (data?.error) throw new Error(data.error);

      return true;
    } catch (error: unknown) {
      logger.error('Error sending human message:', error);
      toast.error('Failed to send message');
      return false;
    }
  }, [user?.id]);

  return {
    conversations,
    loading: isLoading || ownerLoading,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,
    fetchNextPage,
    refetch,
    accountOwnerId, // Expose for error state detection during impersonation
    // Message & conversation operations
    fetchMessages,
    updateConversationStatus,
    updateConversationMetadata,
    takeover,
    returnToAI,
    sendHumanMessage,
    reopenConversation,
  };
}
