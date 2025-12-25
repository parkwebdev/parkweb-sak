/**
 * ChatWidget Component
 * 
 * Main widget component that orchestrates all chat functionality.
 * Manages view navigation, message sending, real-time subscriptions,
 * and coordinates between extracted hooks and sub-components.
 * 
 * @module widget/ChatWidget
 * 
 * @description
 * This is the root component for the embedded chat widget that handles:
 * - Multi-view navigation (Home, Messages, Help, News)
 * - Real-time message sending and receiving
 * - Contact form submission and lead creation
 * - Human takeover detection and display
 * - Visitor analytics and presence tracking
 * - File attachments and voice recording
 * - Parent window communication (iframe mode)
 * 
 * @example
 * ```tsx
 * // Embedded mode with agent ID only (config fetched from API)
 * <ChatWidget config={{ agentId: 'agent-123' }} />
 * 
 * // Preview mode in admin panel with full config
 * <ChatWidget config={fullConfig} previewMode containedPreview />
 * ```
 */
import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { submitConversationRating, type WidgetConfig } from './api';
import { widgetLogger, configureWidgetLogger } from './utils';

// Types and constants extracted for maintainability
import type { ViewType, ChatUser, ChatWidgetProps } from './types';
import { getIsMobileFullScreen, positionClasses } from './constants';

// Extracted hooks for state management
import {
  useWidgetConfig,
  useSoundSettings,
  useVisitorAnalytics,
  useParentMessages,
  useRealtimeMessages,
  useConversationStatus,
  useTypingIndicator,
  useVisitorPresence,
  useWidgetConversations,
  useWidgetMessaging,
  useWidgetAudioRecording,
  useWidgetNavigation,
  useWidgetRating,
  useWidgetTakeover,
} from './hooks';

// View Components - HomeView and ChatView are always needed, lazy-load the rest
import { HomeView } from './views/HomeView';
import { ChatView } from './views/ChatView';

// Lazy-loaded views (~15KB savings from initial load)
const HelpView = lazy(() => import('./views/HelpView').then(m => ({ default: m.HelpView })));
const NewsView = lazy(() => import('./views/NewsView').then(m => ({ default: m.NewsView })));

// UI Components
import { FloatingButton, WidgetHeader, WidgetNav, SatisfactionRating } from './components';
import { WidgetCard } from './ui';

/**
 * Props for the inner widget component that requires a non-null config
 */
interface ChatWidgetInnerProps {
  config: WidgetConfig;
  previewMode: boolean;
  containedPreview: boolean;
  isContentLoading: boolean;
  parentHandlesConfig: boolean;
}

/**
 * Inner widget component that contains all the hooks and UI logic.
 * Only rendered when config is guaranteed to be non-null.
 */
const ChatWidgetInner = ({ 
  config, 
  previewMode, 
  containedPreview, 
  isContentLoading,
  parentHandlesConfig,
}: ChatWidgetInnerProps) => {
  const agentId = config.agentId;
  
  // Mobile detection for removing border radius on full-screen mobile
  const [isMobileFullScreen, setIsMobileFullScreen] = useState(getIsMobileFullScreen);
  
  useEffect(() => {
    const handleResize = () => setIsMobileFullScreen(getIsMobileFullScreen());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('home');
  
  const [chatUser, setChatUser] = useState<ChatUser | null>(() => {
    const stored = localStorage.getItem(`chatpad_user_${agentId}`);
    return stored ? JSON.parse(stored) : null;
  });
  // File attachment state (kept local - simple UI toggle)
  const [isAttachingFiles, setIsAttachingFiles] = useState(false);
  const [formLoadTime] = useState(() => Date.now());
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [headerScrollY, setHeaderScrollY] = useState(0);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  
  // Visitor ID state
  const [visitorId] = useState(() => {
    const stored = localStorage.getItem(`chatpad_visitor_id_${agentId}`);
    if (stored) return stored;
    const newId = `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(`chatpad_visitor_id_${agentId}`, newId);
    return newId;
  });

  // Sound settings via extracted hook
  const { soundEnabled, setSoundEnabled, playNotificationSound } = useSoundSettings(agentId);

  // Conversation management via extracted hook
  const {
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
  } = useWidgetConversations({
    agentId,
    chatUser,
    previewMode,
    isOpen,
    currentView,
  });

  // Visitor analytics via extracted hook
  const {
    pageVisits,
    setPageVisits,
    referrerJourney,
    setReferrerJourney,
    currentPageRef,
    parentPageUrlRef,
    parentReferrerRef,
    parentUtmParamsRef,
    browserLanguageRef,
  } = useVisitorAnalytics({
    agentId,
    visitorId,
    previewMode,
    activeConversationId,
  });

  // Rating state via extracted hook (PHASE 4 REFACTOR)
  const {
    showRatingPrompt,
    ratingTriggerType,
    triggerRating,
    dismissRating,
  } = useWidgetRating();

  // Takeover and typing state via extracted hook (PHASE 5 REFACTOR)
  const {
    isHumanTakeover,
    setIsHumanTakeover,
    takeoverAgentName,
    setTakeoverAgentName,
    takeoverAgentAvatar,
    setTakeoverAgentAvatar,
    isHumanTyping,
    setIsHumanTyping,
    typingAgentName,
    setTypingAgentName,
  } = useWidgetTakeover();

  // Messaging via extracted hook (PHASE 1 REFACTOR)
  const {
    messageInput,
    setMessageInput,
    pendingFiles,
    setPendingFiles,
    isTyping,
    setIsTyping,
    newMessageIds,
    recentChunkIdsRef,
    handleSendMessage,
    handleQuickReplySelectWithSend,
    handleFormSubmit,
  } = useWidgetMessaging({
    config,
    chatUser,
    setChatUser,
    activeConversationId,
    setActiveConversationId,
    pageVisits,
    setPageVisits,
    referrerJourney,
    visitorId,
    isOpen,
    currentView,
    setMessages,
    markConversationFetched,
    isActivelySendingRef,
    currentPageRef,
    browserLanguageRef,
    triggerRating,
    setIsHumanTakeover,
    setTakeoverAgentName,
    setTakeoverAgentAvatar,
  });

  // Audio recording via extracted hook (PHASE 2 REFACTOR)
  const {
    isRecordingAudio,
    recordingTime,
    startAudioRecording,
    stopAudioRecording,
    cancelAudioRecording,
  } = useWidgetAudioRecording({ setMessages });

  // Navigation handlers via extracted hook (PHASE 3 REFACTOR)
  const {
    handleQuickActionClick,
    handleMessagesClick,
    handleStartNewConversation,
    handleOpenConversation,
  } = useWidgetNavigation({
    chatUser,
    setCurrentView,
    setActiveConversationId,
    setShowConversationList,
    setMessages,
    clearMessagesAndFetch,
    isOpeningConversationRef,
  });

  const { notifyUnreadCount, notifyClose } = useParentMessages(
    {
      previewMode,
      agentId,
      visitorId,
      activeConversationId,
      referrerJourney,
      setIsOpen,
      setReferrerJourney,
      setPageVisits,
    },
    {
      parentPageUrlRef,
      parentReferrerRef,
      parentUtmParamsRef,
      currentPageRef,
      browserLanguageRef,
    }
  );

  // Real-time message subscriptions via extracted hook
  useRealtimeMessages({
    activeConversationId,
    isOpen,
    currentView,
    soundEnabled,
    playNotificationSound,
    setMessages,
    setIsTyping,
    setTakeoverAgentName,
    setTakeoverAgentAvatar,
    recentChunkIdsRef,
  });

  // Conversation status (takeover) via extracted hook
  useConversationStatus({
    agentId,
    activeConversationId,
    isHumanTakeover,
    setIsHumanTakeover,
    setTakeoverAgentName,
    setTakeoverAgentAvatar,
    setMessages,
    onConversationClosed: () => {
      // Team member closed conversation - trigger rating prompt
      triggerRating('team_closed');
    },
  });

  // Typing indicator via extracted hook
  useTypingIndicator({
    activeConversationId,
    setIsHumanTyping,
    setTypingAgentName,
  });

  // Visitor presence via extracted hook
  useVisitorPresence({
    agentId,
    visitorId,
    isOpen,
    previewMode,
    config,
    chatUser,
  });

  // Scroll to bottom when file attachment opens
  useEffect(() => {
    if (isAttachingFiles && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isAttachingFiles, messagesEndRef]);

  // Immediately clear parent badge when widget opens
  useEffect(() => {
    if (isOpen && window.parent !== window) {
      notifyUnreadCount(0);
    }
  }, [isOpen, notifyUnreadCount]);

  // Calculate and notify unread count
  useEffect(() => {
    const readKey = `chatpad_last_read_${agentId}_${activeConversationId}`;
    const lastReadTimestamp = localStorage.getItem(readKey);
    const lastReadDate = lastReadTimestamp ? new Date(lastReadTimestamp) : null;
    
    const unread = messages.filter(m => {
      if (m.role !== 'assistant') return false;
      if (m.read) return false;
      if (lastReadDate && m.timestamp <= lastReadDate) return false;
      return true;
    }).length;
    
    setUnreadCount(unread);
    notifyUnreadCount(unread);
  }, [messages, agentId, activeConversationId, notifyUnreadCount]);

  // Send resize notifications based on content
  useEffect(() => {
    if (!previewMode && window.parent !== window) {
      const handleResize = () => {
        const widgetElement = document.getElementById('chatpad-widget-root');
        if (widgetElement) {
          const height = widgetElement.scrollHeight;
          window.parent.postMessage({
            type: 'chatpad-widget-resize',
            height: height
          }, '*');
        }
      };

      handleResize();

      const resizeObserver = new ResizeObserver(handleResize);
      const widgetElement = document.getElementById('chatpad-widget-root');
      if (widgetElement) {
        resizeObserver.observe(widgetElement);
      }

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [messages, currentView, chatUser, previewMode]);

  // Calculate logo opacity based on scroll
  const logoOpacity = Math.max(0, 1 - Math.pow(headerScrollY / 120, 1.5));

  const position = (config.position || 'bottom-right') as keyof typeof positionClasses;
  const isIframeMode = !previewMode && window.parent !== window;

  const handleClose = () => {
    setIsOpen(false);
    if (isIframeMode) {
      notifyClose();
    }
  };

  // Widget content
  const widgetContent = (
    <div id="chatpad-widget-root" className="h-full bg-transparent flex flex-col items-end gap-4 justify-end">
      {(isOpen || isIframeMode) && (
        <WidgetCard
          className={isIframeMode 
            ? `w-full h-full flex flex-col shadow-none overflow-hidden border-0 ${isMobileFullScreen ? 'rounded-none' : 'rounded-3xl'}` 
            : "w-[380px] h-[650px] flex flex-col shadow-xl overflow-hidden border-0 rounded-3xl"}
          style={{
            background: currentView === 'home' 
              ? `linear-gradient(to bottom right, ${config.gradientStartColor}, ${config.gradientEndColor})`
              : undefined
          }}
        >
          {/* Home View */}
          {currentView === 'home' && (
            <HomeView
              config={config}
              isOpen={isOpen}
              isIframeMode={isIframeMode}
              isContentLoading={isContentLoading}
              logoOpacity={logoOpacity}
              onClose={handleClose}
              onQuickActionClick={handleQuickActionClick}
              onScrollChange={setHeaderScrollY}
            />
          )}

          {/* Non-home views header */}
          {currentView !== 'home' && (
            <WidgetHeader
              title={currentView === 'messages' ? 'Ari' : currentView === 'news' ? 'News Center' : 'Help Center'}
              primaryColor={config.primaryColor}
              onClose={handleClose}
              soundEnabled={soundEnabled}
              onSoundToggle={() => {
                setSoundEnabled(!soundEnabled);
                setShowSettingsDropdown(false);
              }}
              showSettingsDropdown={showSettingsDropdown}
              onSettingsToggle={() => setShowSettingsDropdown(!showSettingsDropdown)}
            />
          )}

          {/* Content - Only for non-home views */}
          {currentView !== 'home' && (
            <div className="flex-1 overflow-hidden bg-background flex flex-col min-h-0">
              {currentView === 'messages' && (
                <div className="flex-1 flex flex-col widget-view-enter min-h-0 relative">
                  <ChatView
                    config={config}
                    messages={messages}
                    setMessages={setMessages}
                    chatUser={chatUser}
                    setChatUser={setChatUser}
                    messageInput={messageInput}
                    setMessageInput={setMessageInput}
                    pendingFiles={pendingFiles}
                    setPendingFiles={setPendingFiles}
                    isTyping={isTyping}
                    isHumanTyping={isHumanTyping}
                    typingAgentName={typingAgentName}
                    isHumanTakeover={isHumanTakeover}
                    takeoverAgentName={takeoverAgentName}
                    takeoverAgentAvatar={takeoverAgentAvatar}
                    isRecordingAudio={isRecordingAudio}
                    recordingTime={recordingTime}
                    isAttachingFiles={isAttachingFiles}
                    setIsAttachingFiles={setIsAttachingFiles}
                    formLoadTime={formLoadTime}
                    isLoadingMessages={isLoadingMessages}
                    messagesContainerRef={messagesContainerRef}
                    messagesEndRef={messagesEndRef}
                    onSendMessage={handleSendMessage}
                    onQuickReplySelect={handleQuickReplySelectWithSend}
                    onStartRecording={startAudioRecording}
                    onStopRecording={stopAudioRecording}
                    onCancelRecording={cancelAudioRecording}
                    onFormSubmit={handleFormSubmit}
                    newMessageIds={newMessageIds}
                  />
                  
                  {/* Satisfaction Rating Prompt */}
                  {showRatingPrompt && activeConversationId && (
                    <SatisfactionRating
                      conversationId={activeConversationId}
                      triggerType={ratingTriggerType}
                      primaryColor={config.primaryColor}
                      onSubmit={async (rating, feedback) => {
                        await submitConversationRating(activeConversationId, rating, ratingTriggerType, feedback);
                      }}
                      onDismiss={dismissRating}
                    />
                  )}
                </div>
              )}

              {currentView === 'help' && (
                <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                  <HelpView
                    config={config}
                    helpCategories={config.helpCategories}
                    helpArticles={config.helpArticles}
                  />
                </Suspense>
              )}

              {currentView === 'news' && (
                <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                  <NewsView
                    config={config}
                    newsItems={config.newsItems || []}
                  />
                </Suspense>
              )}
            </div>
          )}

          {/* Bottom Navigation */}
          <WidgetNav
            currentView={currentView}
            onViewChange={setCurrentView}
            unreadCount={unreadCount}
            primaryColor={config.primaryColor}
            onMessagesClick={handleMessagesClick}
            enableHelpTab={config.enableHelpTab}
            enableNewsTab={config.enableNewsTab}
          />
        </WidgetCard>
      )}
      
      {/* FloatingButton - only in contained preview mode, not iframe (parent handles button) */}
      {!isIframeMode && (
        <FloatingButton
          onClick={() => setIsOpen(!isOpen)}
          isOpen={isOpen}
        />
      )}
    </div>
  );

  // For iframe mode, render widget content directly
  if (isIframeMode) {
    return widgetContent;
  }

  // For contained preview mode (embed tab preview), render with absolute positioning
  if (containedPreview) {
    return (
      <div className="absolute inset-0 flex items-end justify-end p-4 pointer-events-none">
        <div className="pointer-events-auto">
          {widgetContent}
        </div>
      </div>
    );
  }

  // Default mode: fixed position (for admin preview or standalone testing)
  return (
    <div className={`fixed ${positionClasses[position]} z-[9999] p-4`}>
      {widgetContent}
    </div>
  );
};

/**
 * Outer shell component that handles config loading before rendering the inner widget.
 * This ensures hooks in ChatWidgetInner are never called with null config.
 */
export const ChatWidget = ({ 
  config: configProp, 
  previewMode = false, 
  containedPreview = false, 
  isLoading: isLoadingProp = false 
}: ChatWidgetProps) => {
  // Configure logger once on mount based on previewMode
  useEffect(() => {
    configureWidgetLogger({ previewMode });
  }, [previewMode]);

  // Config management via extracted hook
  const { config, loading, isContentLoading, parentHandlesConfig } = useWidgetConfig(
    configProp,
    isLoadingProp,
    previewMode
  );

  // Show loading state while config is being fetched
  if (loading || !config) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  // Config is guaranteed non-null here, render the inner widget
  return (
    <ChatWidgetInner
      config={config}
      previewMode={previewMode}
      containedPreview={containedPreview}
      isContentLoading={isContentLoading}
      parentHandlesConfig={parentHandlesConfig}
    />
  );
};
