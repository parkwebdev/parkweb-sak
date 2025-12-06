/**
 * useRealtimeMessages Hook
 * 
 * Manages real-time message subscriptions for human takeover.
 */

import { useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { subscribeToMessages, unsubscribeFromMessages } from '../api';
import { isValidUUID } from '../utils';
import type { Message } from '../types';

interface UseRealtimeMessagesOptions {
  activeConversationId: string | null;
  isOpen: boolean;
  currentView: string;
  soundEnabled: boolean;
  playNotificationSound: () => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setIsTyping: (typing: boolean) => void;
  setTakeoverAgentName: (name: string | undefined) => void;
  setTakeoverAgentAvatar: (avatar: string | undefined) => void;
}

export function useRealtimeMessages(options: UseRealtimeMessagesOptions) {
  const {
    activeConversationId,
    isOpen,
    currentView,
    soundEnabled,
    playNotificationSound,
    setMessages,
    setIsTyping,
    setTakeoverAgentName,
    setTakeoverAgentAvatar,
  } = options;

  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Only subscribe if we have a valid database conversation ID (UUID format)
    if (!isValidUUID(activeConversationId)) {
      return;
    }

    console.log('[Widget] Setting up real-time subscription for:', activeConversationId);
    
    // Unsubscribe from previous channel if exists
    if (realtimeChannelRef.current) {
      unsubscribeFromMessages(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }

    // Subscribe to new messages and updates
    realtimeChannelRef.current = subscribeToMessages(
      activeConversationId, 
      (newMessage) => {
        // Check if this is a human message (not from AI)
        const isHumanMessage = newMessage.metadata?.sender_type === 'human';
        
        console.log('[Widget] Processing new message:', { 
          id: newMessage.id, 
          isHuman: isHumanMessage,
          content: newMessage.content.substring(0, 50)
        });
        
        // Only add human messages to avoid duplicates (AI messages are added locally)
        if (isHumanMessage) {
          const senderName = newMessage.metadata?.sender_name;
          const senderAvatar = newMessage.metadata?.sender_avatar;
          
          setMessages(prev => {
            // Check if message already exists to prevent duplicates
            if (prev.some(m => m.id === newMessage.id)) {
              return prev;
            }
            
            return [...prev, {
              id: newMessage.id,
              role: 'assistant' as const,
              content: newMessage.content,
              read: isOpen && currentView === 'messages',
              timestamp: new Date(newMessage.created_at),
              type: 'text' as const,
              reactions: newMessage.metadata?.reactions || [],
              isHuman: true,
              senderName,
              senderAvatar,
            }];
          });

          // Update takeover agent info for the banner
          if (senderName) {
            setTakeoverAgentName(senderName);
            setTakeoverAgentAvatar(senderAvatar);
          }

          // Also stop typing indicator if it was showing
          setIsTyping(false);
          
          // Play notification sound for new human messages
          playNotificationSound();
        }
      },
      // Handle message updates (for real-time reaction sync AND read receipts)
      (updatedMessage) => {
        console.log('[Widget] Message updated:', updatedMessage.id, updatedMessage.metadata);
        setMessages(prev => prev.map(msg => 
          msg.id === updatedMessage.id 
            ? { 
                ...msg, 
                reactions: updatedMessage.metadata?.reactions || [],
                read_at: updatedMessage.metadata?.read_at,
              }
            : msg
        ));
      }
    );

    return () => {
      if (realtimeChannelRef.current) {
        unsubscribeFromMessages(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [activeConversationId, isOpen, currentView, playNotificationSound]);

  return realtimeChannelRef;
}
