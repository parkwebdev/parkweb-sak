/**
 * useConversationStatus Hook
 * 
 * Subscribes to conversation status changes for human takeover.
 */

import { useEffect, useRef, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { subscribeToConversationStatus, unsubscribeFromConversationStatus, fetchTakeoverAgent } from '../api';
import { isValidUUID, hasTakeoverNoticeBeenShown, setTakeoverNoticeShown, clearTakeoverNotice } from '../utils';
import type { Message } from '../types';

interface UseConversationStatusOptions {
  agentId: string;
  activeConversationId: string | null;
  isHumanTakeover: boolean;
  setIsHumanTakeover: (takeover: boolean) => void;
  setTakeoverAgentName: (name: string | undefined) => void;
  setTakeoverAgentAvatar: (avatar: string | undefined) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export function useConversationStatus(options: UseConversationStatusOptions) {
  const {
    agentId,
    activeConversationId,
    isHumanTakeover,
    setIsHumanTakeover,
    setTakeoverAgentName,
    setTakeoverAgentAvatar,
    setMessages,
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
