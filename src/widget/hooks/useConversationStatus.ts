/**
 * useConversationStatus Hook
 * 
 * Subscribes to conversation status changes for human takeover detection.
 * Handles takeover notices, agent info fetching, and status transitions.
 * 
 * @module widget/hooks/useConversationStatus
 * 
 * @example
 * ```tsx
 * const { checkTakeoverNoticeShown, markTakeoverNoticeShown } = useConversationStatus({
 *   agentId: 'agent-123',
 *   activeConversationId: 'conv-123',
 *   isHumanTakeover: false,
 *   setIsHumanTakeover,
 *   setTakeoverAgentName,
 *   setTakeoverAgentAvatar,
 *   setMessages
 * });
 * ```
 */

import { useEffect, useRef, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { subscribeToConversationStatus, unsubscribeFromConversationStatus, fetchTakeoverAgent } from '../api';
import { isValidUUID, hasTakeoverNoticeBeenShown, setTakeoverNoticeShown, clearTakeoverNotice } from '../utils';
import type { Message } from '../types';

/** Options for the useConversationStatus hook */
interface UseConversationStatusOptions {
  /** Agent ID for localStorage keys */
  agentId: string;
  /** Active conversation ID (UUID format) */
  activeConversationId: string | null;
  /** Current human takeover state */
  isHumanTakeover: boolean;
  /** Setter for human takeover state */
  setIsHumanTakeover: (takeover: boolean) => void;
  /** Setter for takeover agent name */
  setTakeoverAgentName: (name: string | undefined) => void;
  /** Setter for takeover agent avatar URL */
  setTakeoverAgentAvatar: (avatar: string | undefined) => void;
  /** State setter for messages (to add system notices) */
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  /** Optional callback when conversation is closed by team (triggers rating) */
  onConversationClosed?: () => void;
}

/**
 * Hook for subscribing to conversation status changes.
 * 
 * @param options - Configuration options for subscriptions
 * @returns Takeover notice utility functions
 */
export function useConversationStatus(options: UseConversationStatusOptions) {
  const {
    agentId,
    activeConversationId,
    isHumanTakeover,
    setIsHumanTakeover,
    setTakeoverAgentName,
    setTakeoverAgentAvatar,
    setMessages,
    onConversationClosed,
  } = options;

  const statusChannelRef = useRef<RealtimeChannel | null>(null);

  // Takeover notice helpers
  const checkTakeoverNoticeShown = useCallback((convId: string) => {
    return hasTakeoverNoticeBeenShown(agentId, convId);
  }, [agentId]);
  
  const markTakeoverNoticeShown = useCallback((convId: string) => {
    setTakeoverNoticeShown(agentId, convId);
  }, [agentId]);
  
  const resetTakeoverNotice = useCallback((convId: string) => {
    clearTakeoverNotice(agentId, convId);
  }, [agentId]);

  // Subscribe to conversation status changes
  useEffect(() => {
    if (!isValidUUID(activeConversationId)) {
      setIsHumanTakeover(false);
      return;
    }

    console.log('[Widget] Setting up status subscription for:', activeConversationId);
    
    if (statusChannelRef.current) {
      unsubscribeFromConversationStatus(statusChannelRef.current);
      statusChannelRef.current = null;
    }

    statusChannelRef.current = subscribeToConversationStatus(activeConversationId, async (status) => {
      console.log('[Widget] Status changed to:', status);
      const wasTakeover = isHumanTakeover;
      setIsHumanTakeover(status === 'human_takeover');
      
      // Handle conversation closed by team - trigger rating
      if (status === 'closed') {
        console.log('[Widget] Conversation closed by team, triggering rating prompt');
        onConversationClosed?.();
        return;
      }
      
      // Clear the takeover notice flag when returning to AI so next takeover shows notice again
      if (status !== 'human_takeover') {
        resetTakeoverNotice(activeConversationId);
        return;
      }
      
      // When takeover starts, show a system notice only once (persisted across page navigations)
      if (status === 'human_takeover' && !wasTakeover) {
        // Check if we already showed a notice for this conversation (persisted in localStorage)
        if (checkTakeoverNoticeShown(activeConversationId)) {
          return;
        }
        
        // Mark that we've shown the notice for this conversation (persisted)
        markTakeoverNoticeShown(activeConversationId);
        
        // Fetch agent info for personalized message
        const agent = await fetchTakeoverAgent(activeConversationId);
        const agentName = agent?.name || 'A team member';
        setTakeoverAgentName(agent?.name);
        setTakeoverAgentAvatar(agent?.avatar);
        
        // Add system notice (no emoji, no timestamp)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `${agentName} has joined the conversation`,
          read: true,
          timestamp: new Date(),
          type: 'text',
          reactions: [],
          isSystemNotice: true,
        }]);
      }
    });

    return () => {
      if (statusChannelRef.current) {
        unsubscribeFromConversationStatus(statusChannelRef.current);
        statusChannelRef.current = null;
      }
    };
  }, [activeConversationId, isHumanTakeover]);

  return {
    checkTakeoverNoticeShown,
    markTakeoverNoticeShown,
    resetTakeoverNotice,
  };
}
