/**
 * useConversations Hook
 * 
 * Manages conversation and message state using database as source of truth.
 * No localStorage for conversations/messages - only database.
 */

import { useState, useEffect, useRef } from 'react';
import { fetchConversationMessages, markMessagesRead } from '../api';
import { isValidUUID } from '../utils';
import type { Message, ChatUser } from '../types';

interface UseConversationsOptions {
  agentId: string;
  chatUser: ChatUser | null;
  previewMode: boolean;
  isOpen: boolean;
  currentView: string;
}

export function useConversations(options: UseConversationsOptions) {
  const { agentId, chatUser, previewMode, isOpen, currentView } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showConversationList, setShowConversationList] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isOpeningConversationRef = useRef(false);
  const fetchedConversationIdRef = useRef<string | null>(null);
  const isActivelySendingRef = useRef(false);

  // Initialize activeConversationId from chatUser if available (for returning users)
  useEffect(() => {
    if (chatUser?.conversationId && !activeConversationId) {
      console.log('[Widget] Restoring conversation ID from chatUser:', chatUser.conversationId);
      setActiveConversationId(chatUser.conversationId);
    }
  }, [chatUser?.conversationId, activeConversationId]);

  // Fetch messages from database when activeConversationId changes
  useEffect(() => {
    if (!activeConversationId) return;
    
    // Only fetch if conversationId is valid UUID (database ID)
    if (!isValidUUID(activeConversationId)) return;
    
    // Skip if we already fetched for this specific conversation
    if (fetchedConversationIdRef.current === activeConversationId) return;
    
    // Skip fetch if we're actively sending a message - messages are already in local state
    if (isActivelySendingRef.current) {
      console.log('[Widget] Skipping DB fetch - actively sending message');
      fetchedConversationIdRef.current = activeConversationId;
      return;
    }
    
    const loadMessagesFromDB = async () => {
      fetchedConversationIdRef.current = activeConversationId;
      setIsLoadingMessages(true);
      console.log('[Widget] Fetching messages from database for:', activeConversationId);
      
      try {
        const dbMessages = await fetchConversationMessages(activeConversationId);
        
        if (dbMessages.length > 0) {
          const formattedMessages: Message[] = dbMessages.map(msg => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.created_at),
            type: 'text' as const,
            reactions: (msg.metadata as any)?.reactions || [],
            isHuman: (msg.metadata as any)?.sender_type === 'human',
            senderName: (msg.metadata as any)?.sender_name,
            senderAvatar: (msg.metadata as any)?.sender_avatar,
            read_at: (msg.metadata as any)?.read_at,
            read: !!((msg.metadata as any)?.read_at),
            linkPreviews: (msg.metadata as any)?.link_previews,
          }));
          
          setMessages(formattedMessages);
          console.log('[Widget] Loaded', formattedMessages.length, 'messages from database');
        } else {
          // Don't overwrite existing messages (like greeting) with empty array
          console.log('[Widget] No messages found in database, preserving local messages');
        }
      } finally {
        setIsLoadingMessages(false);
      }
    };
    
    loadMessagesFromDB();
  }, [activeConversationId]);

  // Auto-scroll (always enabled)
  useEffect(() => {
    if (currentView === 'messages' && activeConversationId) {
      const scrollToBottom = () => {
        if (messagesEndRef.current) {
          const behavior = isOpeningConversationRef.current ? 'instant' : 'smooth';
          messagesEndRef.current.scrollIntoView({ behavior });
          isOpeningConversationRef.current = false;
        }
      };
      
      // Double RAF ensures the DOM has painted after state changes
      requestAnimationFrame(() => {
        requestAnimationFrame(scrollToBottom);
      });
    }
  }, [messages, currentView, activeConversationId]);

  // Mark messages as read when viewing conversation
  useEffect(() => {
    const hasValidConversation = isValidUUID(activeConversationId);
    
    if (currentView === 'messages' && hasValidConversation && isOpen) {
      const timer = setTimeout(async () => {
        const result = await markMessagesRead(activeConversationId, 'user');
        if (result.success && result.updated && result.updated > 0) {
          console.log('[Widget] Marked', result.updated, 'messages as read');
          setMessages(prev => prev.map(m => 
            m.role === 'assistant' && !m.read 
              ? { ...m, read: true } 
              : m
          ));
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentView, activeConversationId, isOpen, messages.length]);

  // Reset fetched ref when clearing messages (switching conversations)
  const clearMessagesAndFetch = (conversationId: string) => {
    fetchedConversationIdRef.current = null; // Reset to allow fresh fetch
    isActivelySendingRef.current = false; // Ensure we don't block fetches when opening a conversation
    setIsLoadingMessages(true); // Show loading state instead of blank
    setMessages([]); // Clear messages before fetching new ones
    setActiveConversationId(conversationId);
  };

  // Allow external code to mark a conversation as already fetched (prevents DB overwrite)
  const markConversationFetched = (conversationId: string) => {
    fetchedConversationIdRef.current = conversationId;
  };

  return {
    messages,
    setMessages,
    activeConversationId,
    setActiveConversationId,
    showConversationList,
    setShowConversationList,
    isLoadingMessages,
    messagesContainerRef,
    messagesEndRef,
    isOpeningConversationRef,
    clearMessagesAndFetch,
    isActivelySendingRef,
    markConversationFetched,
  };
}
