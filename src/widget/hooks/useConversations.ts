/**
 * useConversations Hook
 * 
 * Manages conversation list and message state.
 */

import { useState, useEffect, useRef } from 'react';
import { fetchConversationMessages, markMessagesRead } from '../api';
import { isValidUUID } from '../utils';
import type { Message, Conversation, ChatUser } from '../types';

interface UseConversationsOptions {
  agentId: string;
  chatUser: ChatUser | null;
  previewMode: boolean;
  isOpen: boolean;
  currentView: string;
}

export function useConversations(options: UseConversationsOptions) {
  const { agentId, chatUser, previewMode, isOpen, currentView } = options;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showConversationList, setShowConversationList] = useState(false);
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isOpeningConversationRef = useRef(false);

  // Initialize activeConversationId from chatUser if available (for returning users)
  useEffect(() => {
    if (chatUser?.conversationId && !activeConversationId) {
      console.log('[Widget] Restoring conversation ID from chatUser:', chatUser.conversationId);
      setActiveConversationId(chatUser.conversationId);
    }
  }, [chatUser?.conversationId, activeConversationId]);

  // Fetch messages from database when widget loads with existing conversationId
  useEffect(() => {
    if (!activeConversationId) return;
    
    // Only fetch if conversationId is valid UUID (database ID)
    if (!isValidUUID(activeConversationId)) return;
    
    // Only fetch if we don't already have messages (to avoid refetching on every update)
    if (messages.length > 0) return;
    
    const loadMessagesFromDB = async () => {
      console.log('[Widget] Fetching messages from database for:', activeConversationId);
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
      }
    };
    
    loadMessagesFromDB();
  }, [activeConversationId, messages.length]);

  // Load conversations from localStorage (with migration from old format)
  useEffect(() => {
    const stored = localStorage.getItem(`chatpad_conversations_${agentId}`);
    const oldStored = localStorage.getItem(`chatpad_messages_${agentId}`);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const conversationsWithDates = parsed.map((conv: any) => ({
          ...conv,
          messages: conv.messages.map((msg: any) => ({ ...msg, timestamp: new Date(msg.timestamp) }))
        }));
        setConversations(conversationsWithDates);
      } catch (error) {
        console.error('Error loading conversations:', error);
      }
    } else if (oldStored) {
      // Migrate old messages format to conversations
      try {
        const parsed = JSON.parse(oldStored);
        const messagesWithDates = parsed.map((msg: any) => ({ ...msg, timestamp: new Date(msg.timestamp) }));
        if (messagesWithDates.length > 0) {
          const migratedConversation: Conversation = {
            id: 'migrated_' + Date.now(),
            messages: messagesWithDates,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            preview: messagesWithDates[messagesWithDates.length - 1]?.content || 'Previous conversation'
          };
          setConversations([migratedConversation]);
          localStorage.setItem(`chatpad_conversations_${agentId}`, JSON.stringify([migratedConversation]));
          localStorage.removeItem(`chatpad_messages_${agentId}`);
        }
      } catch (error) {
        console.error('Error migrating messages:', error);
      }
    }
  }, [agentId]);

  // Save conversations to localStorage and update active conversation
  useEffect(() => {
    if (activeConversationId && messages.length > 0) {
      const existingIndex = conversations.findIndex(c => c.id === activeConversationId);
      const lastMessage = messages[messages.length - 1];
      const updatedConversation: Conversation = {
        id: activeConversationId,
        messages: messages,
        createdAt: existingIndex >= 0 ? conversations[existingIndex].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        preview: lastMessage?.content.slice(0, 60) || 'New conversation'
      };

      const updatedConversations = existingIndex >= 0
        ? conversations.map((c, i) => i === existingIndex ? updatedConversation : c)
        : [updatedConversation, ...conversations];

      setConversations(updatedConversations);
      localStorage.setItem(`chatpad_conversations_${agentId}`, JSON.stringify(updatedConversations));
    }
  }, [messages, activeConversationId, agentId]);

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
          
          // Persist read timestamp to localStorage
          const readKey = `chatpad_last_read_${agentId}_${activeConversationId}`;
          localStorage.setItem(readKey, new Date().toISOString());
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentView, activeConversationId, isOpen, messages.length, agentId]);

  return {
    conversations,
    setConversations,
    messages,
    setMessages,
    activeConversationId,
    setActiveConversationId,
    showConversationList,
    setShowConversationList,
    messagesContainerRef,
    messagesEndRef,
    isOpeningConversationRef,
  };
}
