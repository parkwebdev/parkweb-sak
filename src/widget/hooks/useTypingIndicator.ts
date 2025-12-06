/**
 * useTypingIndicator Hook
 * 
 * Subscribes to typing indicators from human agents.
 */

import { useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { subscribeToTypingIndicator, unsubscribeFromTypingIndicator } from '../api';
import { isValidUUID } from '../utils';

interface UseTypingIndicatorOptions {
  activeConversationId: string | null;
  setIsHumanTyping: (typing: boolean) => void;
  setTypingAgentName: (name: string | undefined) => void;
}

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

    console.log('[Widget] Setting up typing indicator subscription for:', activeConversationId);
    
    if (typingChannelRef.current) {
      unsubscribeFromTypingIndicator(typingChannelRef.current);
      typingChannelRef.current = null;
    }

    typingChannelRef.current = subscribeToTypingIndicator(activeConversationId, (typing, agentName) => {
      console.log('[Widget] Human typing state:', typing, agentName);
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
