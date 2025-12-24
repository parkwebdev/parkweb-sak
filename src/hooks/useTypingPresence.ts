/**
 * useTypingPresence Hook (Admin)
 * 
 * Handles admin typing indicator broadcasting via Supabase Presence.
 * Used when an admin is typing in a human takeover conversation.
 * 
 * @module hooks/useTypingPresence
 * 
 * @example
 * ```tsx
 * const { handleTyping, stopTypingIndicator } = useTypingPresence({
 *   conversation: selectedConversation,
 *   userId: user?.id,
 *   userEmail: user?.email
 * });
 * ```
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Tables } from '@/integrations/supabase/types';

type Conversation = Tables<'conversations'>;

/** Options for the useTypingPresence hook */
export interface UseTypingPresenceOptions {
  /** Current conversation (must be in human_takeover status) */
  conversation: Conversation | null;
  /** Current user ID */
  userId: string | null | undefined;
  /** Current user email (for display in typing indicator) */
  userEmail: string | null | undefined;
}

/** Return type for the useTypingPresence hook */
export interface UseTypingPresenceReturn {
  /** Call when user is typing to broadcast indicator */
  handleTyping: () => void;
  /** Call when typing should stop (e.g., message sent) */
  stopTypingIndicator: () => void;
  /** Whether currently broadcasting typing state */
  isTypingBroadcast: boolean;
}

/**
 * Hook for broadcasting typing indicators from admin to widget.
 * 
 * @param options - Configuration options for typing presence
 * @returns Typing control functions and state
 */
export function useTypingPresence(options: UseTypingPresenceOptions): UseTypingPresenceReturn {
  const { conversation, userId, userEmail } = options;

  const [isTypingBroadcast, setIsTypingBroadcast] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingChannelRef = useRef<RealtimeChannel | null>(null);

  // Set up typing presence channel when conversation is in human takeover mode
  useEffect(() => {
    if (conversation && conversation.status === 'human_takeover' && userId) {
      const channel = supabase.channel(`typing-${conversation.id}`);
      typingChannelRef.current = channel;
      
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ isTyping: false, userId, name: userEmail });
        }
      });

      return () => {
        if (typingChannelRef.current) {
          supabase.removeChannel(typingChannelRef.current);
          typingChannelRef.current = null;
        }
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      };
    }
  }, [conversation?.id, conversation?.status, userId, userEmail]);

  // Handle typing state changes with debounce
  const handleTyping = useCallback(() => {
    if (!typingChannelRef.current || !userId) return;

    // Start typing
    if (!isTypingBroadcast) {
      setIsTypingBroadcast(true);
      typingChannelRef.current.track({ isTyping: true, userId, name: userEmail });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTypingBroadcast(false);
      typingChannelRef.current?.track({ isTyping: false, userId, name: userEmail });
    }, 2000);
  }, [userId, userEmail, isTypingBroadcast]);

  // Stop typing indicator when message is sent
  const stopTypingIndicator = useCallback(() => {
    if (typingChannelRef.current && userId) {
      typingChannelRef.current.track({ isTyping: false, userId, name: userEmail });
    }
    setIsTypingBroadcast(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [userId, userEmail]);

  return {
    handleTyping,
    stopTypingIndicator,
    isTypingBroadcast,
  };
}
