/**
 * useRealtimeMessages Hook
 * 
 * Manages real-time message subscriptions for human takeover conversations.
 * Subscribes to Supabase Realtime for INSERT and UPDATE events on messages.
 * 
 * @module widget/hooks/useRealtimeMessages
 * 
 * @example
 * ```tsx
 * const channelRef = useRealtimeMessages({
 *   activeConversationId: 'conv-123',
 *   isOpen: true,
 *   currentView: 'messages',
 *   soundEnabled: true,
 *   playNotificationSound: () => playSound(),
 *   setMessages,
 *   setIsTyping,
 *   setTakeoverAgentName,
 *   setTakeoverAgentAvatar
 * });
 * ```
 */

import { useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { subscribeToMessages, unsubscribeFromMessages } from '../api';
import { isValidUUID } from '../utils';
import type { Message, WidgetMessageMetadata } from '../types';

/** Options for the useRealtimeMessages hook */
interface UseRealtimeMessagesOptions {
  /** Active conversation ID (UUID format) */
  activeConversationId: string | null;
  /** Whether widget panel is open */
  isOpen: boolean;
  /** Current view tab name */
  currentView: string;
  /** Whether sound notifications are enabled */
  soundEnabled: boolean;
  /** Function to play notification sound */
  playNotificationSound: () => void;
  /** State setter for messages array */
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  /** Setter for AI typing indicator */
  setIsTyping: (typing: boolean) => void;
  /** Setter for takeover agent name */
  setTakeoverAgentName: (name: string | undefined) => void;
  /** Setter for takeover agent avatar URL */
  setTakeoverAgentAvatar: (avatar: string | undefined) => void;
}

/**
 * Hook for subscribing to real-time message updates.
 * 
 * @param options - Configuration options for subscriptions
 * @returns Reference to the Supabase Realtime channel
 */
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
        // Type the metadata
        const metadata = (newMessage.metadata || {}) as WidgetMessageMetadata;
        
        // Check if this is a human message (not from AI)
        const isHumanMessage = metadata.sender_type === 'human';
        
        console.log('[Widget] Processing new message:', { 
          id: newMessage.id, 
          isHuman: isHumanMessage,
          content: newMessage.content.substring(0, 50)
        });
        
        // Only add human messages to avoid duplicates (AI messages are added locally)
        if (isHumanMessage) {
          const senderName = metadata.sender_name;
          const senderAvatar = metadata.sender_avatar;
          
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
              reactions: metadata.reactions || [],
              isHuman: true,
              senderName,
              senderAvatar,
              linkPreviews: metadata.link_previews,
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
        const metadata = (updatedMessage.metadata || {}) as WidgetMessageMetadata;
        console.log('[Widget] Message UPDATE callback invoked:', {
          messageId: updatedMessage.id,
          metadata: metadata,
          reactions: metadata.reactions,
        });
        setMessages(prev => {
          console.log('[Widget] Updating message in state:', updatedMessage.id, 'reactions:', metadata.reactions);
          return prev.map(msg => 
            msg.id === updatedMessage.id 
              ? { 
                  ...msg, 
                  reactions: metadata.reactions || [],
                  read_at: metadata.read_at,
                }
              : msg
          );
        });
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
