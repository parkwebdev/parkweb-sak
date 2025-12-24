/**
 * useTypingIndicator Hook
 * 
 * Subscribes to real-time typing indicators from human agents during takeover.
 * Uses Supabase Presence for ephemeral typing state (not persisted).
 * 
 * @module widget/hooks/useTypingIndicator
 * 
 * @example
 * ```tsx
 * const channelRef = useTypingIndicator({
 *   activeConversationId: 'conv-123',
 *   setIsHumanTyping,
 *   setTypingAgentName
 * });
 * ```
 */

import { useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { subscribeToTypingIndicator, unsubscribeFromTypingIndicator } from '../api';
import { isValidUUID } from '../utils';
import { logger } from '@/utils/logger';

/** Options for the useTypingIndicator hook */
interface UseTypingIndicatorOptions {
  /** Active conversation ID (UUID format) */
  activeConversationId: string | null;
  /** Setter for human typing state */
  setIsHumanTyping: (typing: boolean) => void;
  /** Setter for typing agent's display name */
  setTypingAgentName: (name: string | undefined) => void;
}

/**
 * Hook for subscribing to typing indicators from human agents.
 * 
 * @param options - Configuration options for subscriptions
 * @returns Reference to the Supabase Presence channel
 */
export function useTypingIndicator(options: UseTypingIndicatorOptions) {
  const {
    activeConversationId,
    setIsHumanTyping,
    setTypingAgentName,
  } = options;

  const typingChannelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!isValidUUID(activeConversationId)) {
      setIsHumanTyping(false);
      return;
    }

    logger.debug('[Widget] Setting up typing indicator subscription for:', activeConversationId);
    
    if (typingChannelRef.current) {
      unsubscribeFromTypingIndicator(typingChannelRef.current);
      typingChannelRef.current = null;
    }

    typingChannelRef.current = subscribeToTypingIndicator(activeConversationId, (typing, agentName) => {
      logger.debug('[Widget] Human typing state:', { typing, agentName });
      setIsHumanTyping(typing);
      if (typing && agentName) {
        setTypingAgentName(agentName);
      }
    });

    return () => {
      if (typingChannelRef.current) {
        unsubscribeFromTypingIndicator(typingChannelRef.current);
        typingChannelRef.current = null;
      }
    };
  }, [activeConversationId]);

  return typingChannelRef;
}
