/**
 * useConversations Hook
 * 
 * Manages conversation and message state using the database as the source of truth.
 * Handles message fetching, auto-scrolling, read receipts, and real-time updates.
 * 
 * @module widget/hooks/useConversations
 * 
 * @example
 * ```tsx
 * const {
 *   messages,
 *   setMessages,
 *   activeConversationId,
 *   messagesEndRef
 * } = useConversations({
 *   agentId: 'abc-123',
 *   chatUser: currentUser,
 *   previewMode: false,
 *   isOpen: true,
 *   currentView: 'messages'
 * });
 * ```
 */

import { useState, useEffect, useRef } from 'react';
import { fetchConversationMessages, markMessagesRead } from '../api';
import { isValidUUID } from '../utils';
import type { Message, ChatUser, WidgetMessageMetadata } from '../types';
import { logger } from '@/utils/logger';

/** Options for the useConversations hook */
interface UseConversationsOptions {
  /** Agent ID for the current widget instance */
  agentId: string;
  /** Current chat user (from contact form submission) */
  chatUser: ChatUser | null;
  /** Whether widget is in preview/editor mode */
  previewMode: boolean;
  /** Whether widget panel is currently open */
  isOpen: boolean;
  /** Current view tab (home, messages, help, news) */
  currentView: string;
}

/**
 * Hook for managing conversation and message state.
 * 
 * @param options - Configuration options for the hook
 * @returns Conversation state, setters, refs, and utility functions
 */
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
      logger.debug('[Widget] Restoring conversation ID from chatUser:', chatUser.conversationId);
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
      logger.debug('[Widget] Skipping DB fetch - actively sending message');
      fetchedConversationIdRef.current = activeConversationId;
      return;
    }
    
    // REF-BASED FIX: Check ref instead of messages.length to avoid stale closure issues
    // The ref is updated synchronously when setMessages is called, so it's always current
    if (hasLocalMessagesRef.current) {
      logger.debug('[Widget] Skipping DB fetch - hasLocalMessagesRef is true');
      fetchedConversationIdRef.current = activeConversationId;
      return;
    }
    
    const loadMessagesFromDB = async () => {
      fetchedConversationIdRef.current = activeConversationId;
      setIsLoadingMessages(true);
      logger.debug('[Widget] Fetching messages from database for:', activeConversationId);
      
      try {
        const dbMessages = await fetchConversationMessages(activeConversationId);
        
        if (dbMessages.length > 0) {
          const formattedMessages: Message[] = dbMessages.map(msg => {
            const metadata = (msg.metadata || {}) as WidgetMessageMetadata;
            const files = metadata.files;
            return {
              id: msg.id,
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
              timestamp: new Date(msg.created_at),
              type: files?.length > 0 ? 'file' as const : 'text' as const,
              files: files,
              reactions: metadata?.reactions || [],
              isHuman: metadata?.sender_type === 'human',
              senderName: metadata?.sender_name,
              senderAvatar: metadata?.sender_avatar,
              read_at: metadata?.read_at,
              read: !!(metadata?.read_at),
              linkPreviews: metadata?.link_previews,
            };
          });
          
          // MERGE with existing messages instead of overwriting
          // This preserves local messages (greeting, optimistic updates) while adding DB messages
          setMessages(prev => {
            // NEVER overwrite existing messages with empty DB result
            if (formattedMessages.length === 0) {
              logger.debug(`[Widget] DB returned empty, preserving ${prev.length} local messages`);
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
          
          logger.debug(`[Widget] Merged ${formattedMessages.length} DB messages with local state`);
        } else {
          // Don't overwrite existing messages (like greeting) with empty array
          logger.debug('[Widget] No messages found in database, preserving local messages');
        }
      } finally {
        setIsLoadingMessages(false);
      }
    };
    
    loadMessagesFromDB();
  }, [activeConversationId]);

  // Auto-scroll: scroll to bottom for conversations with messages, scroll to top for empty/form view
  useEffect(() => {
    if (currentView === 'messages' && activeConversationId) {
      // If there are messages, scroll to bottom (for conversation continuity)
      if (messages.length > 0) {
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
      } else {
        // No messages yet (contact form view) - scroll to top
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = 0;
        }
      }
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
          logger.debug(`[Widget] Server confirmed ${result.updated} messages as read`);
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
