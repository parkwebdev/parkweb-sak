/**
 * useConversationMessages Hook
 * 
 * Manages message state, loading, and real-time subscriptions for a conversation.
 * Handles optimistic updates, new message animations, and read tracking.
 * 
 * @module hooks/useConversationMessages
 * 
 * @example
 * ```tsx
 * const { 
 *   messages, 
 *   loadingMessages, 
 *   isNewMessage,
 *   setMessages 
 * } = useConversationMessages({
 *   conversationId: selectedConversation?.id,
 *   fetchMessages,
 *   onMarkRead
 * });
 * ```
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { Tables } from '@/integrations/supabase/types';
import type { MessageMetadata } from '@/types/metadata';

type Message = Tables<'messages'>;

/** Options for the useConversationMessages hook */
export interface UseConversationMessagesOptions {
  /** ID of the conversation to load messages for */
  conversationId: string | null | undefined;
  /** Function to fetch messages from the server */
  fetchMessages: (conversationId: string) => Promise<Message[]>;
  /** Optional callback when messages are loaded */
  onMessagesLoaded?: (messages: Message[]) => void;
}

/** Return type for the useConversationMessages hook */
export interface UseConversationMessagesReturn {
  /** Current messages list */
  messages: Message[];
  /** Set messages (for optimistic updates) */
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  /** Whether messages are being loaded */
  loadingMessages: boolean;
  /** Check if a message is newly added (for animation) */
  isNewMessage: (messageId: string) => boolean;
  /** Ref to track new message IDs (for external access) */
  newMessageIdsRef: React.MutableRefObject<Set<string>>;
  /** Whether this is the initial load */
  isInitialLoadRef: React.MutableRefObject<boolean>;
}

/**
 * Hook for managing conversation messages with real-time updates.
 * 
 * @param options - Configuration options
 * @returns Message state and control functions
 */
export function useConversationMessages(options: UseConversationMessagesOptions): UseConversationMessagesReturn {
  const { conversationId, fetchMessages, onMessagesLoaded } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const isInitialLoadRef = useRef(true);
  const newMessageIdsRef = useRef<Set<string>>(new Set());

  // Load messages when conversation is selected
  useEffect(() => {
    if (!conversationId) return;
    
    let hasLoadedMessages = false;
    isInitialLoadRef.current = true;
    setLoadingMessages(true);

    // Set up real-time subscription for messages
    const channel = supabase
      .channel(`conv-messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          
          setMessages(prev => {
            // Avoid duplicates (real-time + optimistic update race)
            if (prev.some(m => m.id === newMessage.id)) return prev;
            
            // Check if we're replacing an optimistic temp message
            const isReplacingOptimistic = prev.some(m => 
              m.id.startsWith('temp-') && 
              (m.metadata as MessageMetadata)?.pending && 
              m.content === newMessage.content
            );
            
            // Only animate if it's a genuinely new message (not during initial load, not replacing optimistic)
            if (!isInitialLoadRef.current && !isReplacingOptimistic) {
              newMessageIdsRef.current.add(newMessage.id);
              setTimeout(() => newMessageIdsRef.current.delete(newMessage.id), 300);
            }
            
            // Remove any pending optimistic message with matching content
            const withoutTemp = prev.filter(m => {
              if (!m.id.startsWith('temp-')) return true;
              const tempMeta = (m.metadata || {}) as MessageMetadata;
              return !(tempMeta.pending && m.content === newMessage.content);
            });
            return [...withoutTemp, newMessage];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          logger.debug('[Admin] Message UPDATE received', {
            messageId: payload.new?.id,
            metadata: ((payload.new as Message)?.metadata as MessageMetadata),
            reactions: ((payload.new as Message)?.metadata as MessageMetadata)?.reactions,
          });
          const updatedMessage = payload.new as Message;
          setMessages(prev => {
            logger.debug('[Admin] Updating message in state', updatedMessage.id);
            return prev.map(m => m.id === updatedMessage.id ? updatedMessage : m);
          });
        }
      )
      .subscribe(async (status) => {
        logger.debug('[Conversations] Subscription status', status);
        
        if (status === 'SUBSCRIBED' && !hasLoadedMessages) {
          hasLoadedMessages = true;
          await loadMessages(conversationId, true);
        } else if (status === 'CHANNEL_ERROR' && !hasLoadedMessages) {
          logger.error('[Conversations] Channel error - falling back to immediate fetch');
          hasLoadedMessages = true;
          await loadMessages(conversationId, true);
        }
      });

    // Timeout fallback
    const fetchTimeout = setTimeout(() => {
      if (!hasLoadedMessages) {
        logger.debug('[Conversations] Subscription timeout - fetching anyway');
        hasLoadedMessages = true;
        loadMessages(conversationId, true);
      }
    }, 2000);

    return () => {
      clearTimeout(fetchTimeout);
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const loadMessages = useCallback(async (convId: string, showLoading = true) => {
    if (showLoading) setLoadingMessages(true);
    try {
      const msgs = await fetchMessages(convId);
      setMessages(msgs);
      onMessagesLoaded?.(msgs);
      
      // Mark messages as read
      supabase.functions.invoke('mark-messages-read', {
        body: { conversationId: convId, readerType: 'admin' }
      }).then(({ data }) => {
        if (data?.updated > 0) {
          logger.debug('[Conversations] Marked messages as read', data.updated);
        }
      }).catch(err => logger.error('Failed to mark messages as read', err));
    } finally {
      if (showLoading) setLoadingMessages(false);
      isInitialLoadRef.current = false;
    }
  }, [fetchMessages, onMessagesLoaded]);

  // Check if a message is newly added (for animation)
  const isNewMessage = useCallback((messageId: string): boolean => {
    return newMessageIdsRef.current.has(messageId);
  }, []);

  return {
    messages,
    setMessages,
    loadingMessages,
    isNewMessage,
    newMessageIdsRef,
    isInitialLoadRef,
  };
}
