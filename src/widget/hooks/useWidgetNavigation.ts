/**
 * Widget Navigation Hook
 * 
 * Manages navigation handlers for the chat widget.
 * Centralizes all navigation logic including view switching,
 * conversation list toggling, and quick action handling.
 * 
 * Note: currentView state is kept in ChatWidget.tsx because
 * useConversations depends on it. This hook operates in "controlled" mode,
 * receiving currentView/setCurrentView as props.
 * 
 * @module widget/hooks/useWidgetNavigation
 * 
 * @example
 * ```tsx
 * const {
 *   handleQuickActionClick,
 *   handleMessagesClick,
 *   handleStartNewConversation,
 *   handleOpenConversation,
 * } = useWidgetNavigation({
 *   chatUser,
 *   setCurrentView,
 *   setActiveConversationId,
 *   setShowConversationList,
 *   setMessages,
 *   clearMessagesAndFetch,
 *   isOpeningConversationRef,
 * });
 * ```
 */
import { useCallback, type RefObject } from 'react';
import type { ViewType, ChatUser, Message } from '../types';
import { widgetLogger } from '../utils/widget-logger';

interface UseWidgetNavigationProps {
  /** Current authenticated chat user */
  chatUser: ChatUser | null;
  /** Set the current view (controlled mode) */
  setCurrentView: (view: ViewType) => void;
  /** Set the active conversation ID */
  setActiveConversationId: (id: string | null) => void;
  /** Toggle conversation list visibility */
  setShowConversationList: (show: boolean) => void;
  /** Set messages array */
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  /** Clear messages and fetch for a conversation */
  clearMessagesAndFetch: (conversationId: string) => void;
  /** Ref to track if we're opening a conversation (prevents race conditions) */
  isOpeningConversationRef: RefObject<boolean>;
}

interface UseWidgetNavigationReturn {
  /** Handle quick action button clicks (from HomeView) */
  handleQuickActionClick: (actionType: string) => void;
  /** Handle messages tab click */
  handleMessagesClick: () => void;
  /** Start a new conversation */
  handleStartNewConversation: () => void;
  /** Open an existing conversation by ID */
  handleOpenConversation: (conversationId: string) => void;
}

export function useWidgetNavigation({
  chatUser,
  setCurrentView,
  setActiveConversationId,
  setShowConversationList,
  setMessages,
  clearMessagesAndFetch,
  isOpeningConversationRef,
}: UseWidgetNavigationProps): UseWidgetNavigationReturn {

  // === Handlers ===
  
  /**
   * Handle quick action clicks from the home view
   * Routes to appropriate view based on action type
   */
  const handleQuickActionClick = useCallback((actionType: string) => {
    widgetLogger.debug('Quick action clicked', { actionType });
    
    if (actionType === 'start_chat' || actionType === 'chat') {
      setCurrentView('messages');
      if (!chatUser) {
        setActiveConversationId('new');
        setShowConversationList(false);
      } else {
        if (chatUser.conversationId) {
          setActiveConversationId(chatUser.conversationId);
        }
        setShowConversationList(true);
      }
    } else if (actionType === 'open_help' || actionType === 'help') {
      setCurrentView('help');
    }
  }, [chatUser, setCurrentView, setActiveConversationId, setShowConversationList]);

  /**
   * Handle messages tab click
   * Shows conversation list for authenticated users, new conversation for guests
   */
  const handleMessagesClick = useCallback(() => {
    widgetLogger.debug('Messages click', { hasChatUser: !!chatUser });
    
    if (!chatUser) {
      setActiveConversationId('new');
      setShowConversationList(false);
    } else {
      if (chatUser.conversationId) {
        setActiveConversationId(chatUser.conversationId);
      }
      setShowConversationList(true);
    }
  }, [chatUser, setActiveConversationId, setShowConversationList]);

  /**
   * Start a new conversation
   * Creates a temporary conversation ID and shows welcome message for returning users
   */
  const handleStartNewConversation = useCallback(() => {
    widgetLogger.info('Starting new conversation');
    
    const newConvId = 'conv_' + Date.now();
    setActiveConversationId(newConvId);
    setShowConversationList(false);
    
    if (chatUser) {
      setMessages([{
        role: 'assistant',
        content: `Welcome back, ${chatUser.firstName}! 👋 How can I help you today?`,
        read: true,
        timestamp: new Date(),
        type: 'text',
        reactions: [],
      }]);
    } else {
      setMessages([]);
    }
  }, [chatUser, setActiveConversationId, setShowConversationList, setMessages]);

  /**
   * Open an existing conversation
   * Sets the opening ref to prevent race conditions and fetches messages
   */
  const handleOpenConversation = useCallback((conversationId: string) => {
    widgetLogger.info('Opening conversation', { conversationId });
    
    if (isOpeningConversationRef.current !== undefined) {
      (isOpeningConversationRef as React.MutableRefObject<boolean>).current = true;
    }
    clearMessagesAndFetch(conversationId);
    setShowConversationList(false);
  }, [clearMessagesAndFetch, setShowConversationList, isOpeningConversationRef]);

  return {
    handleQuickActionClick,
    handleMessagesClick,
    handleStartNewConversation,
    handleOpenConversation,
  };
}
