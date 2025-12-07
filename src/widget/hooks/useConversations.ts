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

  const [messages, setMessagesInternal] = useState<Message[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showConversationList, setShowConversationList] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isOpeningConversationRef = useRef(false);
  const fetchedConversationIdRef = useRef<string | null>(null);
  const isActivelySendingRef = useRef(false);
  
  // SYNCHRONOUS SHADOW REF FIX: Track messages synchronously
  // React's setState is async, but refs update immediately
  // This prevents race conditions where useEffect runs before state is updated
  const messagesRef = useRef<Message[]>([]);
  const hasLocalMessagesRef = useRef(false);
  
  // Wrapper that updates refs SYNCHRONOUSLY before React's async state update
  const setMessages = (setter: Message[] | ((prev: Message[]) => Message[])) => {
    // Calculate new value using our synchronous ref (NOT React state which is stale)
    const current = messagesRef.current;
    const next = typeof setter === 'function' ? setter(current) : setter;
    
    // Validate that next is an array
    if (!Array.isArray(next)) {
      return;
    }
    
    // Update refs IMMEDIATELY - this happens BEFORE the next line of code runs
    messagesRef.current = next;
    hasLocalMessagesRef.current = next.length > 0;
    
    // Now trigger React's async state update with the already-computed value
    setMessagesInternal(next);
  };

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
    
    // REF-BASED FIX: Check ref instead of messages.length to avoid stale closure issues
    // The ref is updated synchronously when setMessages is called, so it's always current
    if (hasLocalMessagesRef.current) {
      console.log('[Widget] Skipping DB fetch - hasLocalMessagesRef is true');
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
          
          // MERGE with existing messages instead of overwriting
          // This preserves local messages (greeting, optimistic updates) while adding DB messages
          setMessages(prev => {
            // NEVER overwrite existing messages with empty DB result
            if (formattedMessages.length === 0) {
              console.log('[Widget] DB returned empty, preserving', prev.length, 'local messages');
              return prev;
            }
            
            // If no local messages, just use DB messages
            if (prev.length === 0) return formattedMessages;
            
            // Create a set of existing message IDs
            const existingIds = new Set(prev.filter(m => m.id).map(m => m.id));
            
            // Keep local messages without IDs (like greeting, optimistic updates before ID assigned)
            const localWithoutIds = prev.filter(m => !m.id);
            
            // Merge DB messages with local messages that have IDs (deduplicating)
            const mergedWithIds = [...prev.filter(m => m.id)];
            for (const dbMsg of formattedMessages) {
              if (!existingIds.has(dbMsg.id)) {
                mergedWithIds.push(dbMsg);
              }
            }
            
            // Sort messages with IDs by timestamp
            mergedWithIds.sort((a, b) => 
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            
            // Put local messages without IDs (like greeting) at the beginning
            return [...localWithoutIds, ...mergedWithIds];
          });
          
          console.log('[Widget] Merged', formattedMessages.length, 'DB messages with local state');
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
      // Immediately mark messages as read locally (optimistic update)
      setMessages(prev => prev.map(m => 
        m.role === 'assistant' && !m.read 
          ? { ...m, read: true } 
          : m
      ));
      
      // Update localStorage timestamp immediately
      const readKey = `chatpad_last_read_${agentId}_${activeConversationId}`;
      localStorage.setItem(readKey, new Date().toISOString());
      
      // Then sync with server
      const timer = setTimeout(async () => {
        const result = await markMessagesRead(activeConversationId, 'user');
        if (result.success && result.updated && result.updated > 0) {
          console.log('[Widget] Server confirmed', result.updated, 'messages as read');
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentView, activeConversationId, isOpen, agentId]); // Removed messages.length to prevent constant re-runs

  // Reset fetched ref when clearing messages (switching conversations)
  const clearMessagesAndFetch = (conversationId: string) => {
    fetchedConversationIdRef.current = null; // Reset to allow fresh fetch
    isActivelySendingRef.current = false; // Ensure we don't block fetches when opening a conversation
    hasLocalMessagesRef.current = false; // Reset ref to allow DB fetch
    setIsLoadingMessages(true); // Show loading state instead of blank
    setMessages([]); // Clear messages before fetching new ones
    setActiveConversationId(conversationId);
  };

  // Allow external code to mark a conversation as already fetched (prevents DB overwrite)
  const markConversationFetched = (conversationId: string) => {
    fetchedConversationIdRef.current = conversationId;
    hasLocalMessagesRef.current = true; // Also set hasLocalMessages to prevent fetch
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
