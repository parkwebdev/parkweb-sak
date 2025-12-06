import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { createLead, submitArticleFeedback, sendChatMessage, updateMessageReaction, type WidgetConfig, type ReferrerJourney } from './api';

// Types and constants extracted for maintainability
import type { ViewType, ChatUser, Message, Conversation, ChatWidgetProps } from './types';
import { WIDGET_CSS_VARS, VoiceInput, FileDropZone, MessageReactions, AudioPlayer, PhoneInputField, getIsMobileFullScreen, positionClasses } from './constants';
import { formatTimestamp, isValidUUID, getSessionId } from './utils';

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
  useConversations,
} from './hooks';

// UI Components
import { CSSAnimatedList } from './CSSAnimatedList';
import { CSSAnimatedItem } from './CSSAnimatedItem';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Send01, MessageChatCircle, ChevronRight, Zap, BookOpen01, Microphone01, Attachment01, Image03, FileCheck02, ThumbsUp, ThumbsDown, Settings01, VolumeMax, VolumeX, Check, CheckCircle, XCircle } from '@untitledui/icons';
import { LinkPreviews } from '@/components/chat/LinkPreviews';
import { CategoryIcon } from './category-icons';
import { HomeNavIcon, ChatNavIcon, HelpNavIcon } from './NavIcons';
import { ChatBubbleIcon } from '@/components/agents/ChatBubbleIcon';
import ChatPadLogo from '@/components/ChatPadLogo';
import { generateGradientPalette, hexToRgb } from '@/lib/color-utils';
import DOMPurify from 'isomorphic-dompurify';

// Eager load CSSBubbleBackground (CSS-only, ~3KB) to prevent flicker on widget open
import { CSSBubbleBackground } from '@/components/ui/css-bubble-background';

export const ChatWidget = ({ config: configProp, previewMode = false, containedPreview = false, isLoading: isLoadingProp = false }: ChatWidgetProps) => {
  // Mobile detection for removing border radius on full-screen mobile
  const [isMobileFullScreen, setIsMobileFullScreen] = useState(getIsMobileFullScreen);
  
  useEffect(() => {
    const handleResize = () => setIsMobileFullScreen(getIsMobileFullScreen());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Config management via extracted hook
  const { config, loading, isContentLoading, agentId, parentHandlesConfig } = useWidgetConfig(
    configProp,
    isLoadingProp,
    previewMode
  );
  
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  
  const [chatUser, setChatUser] = useState<ChatUser | null>(() => {
    const stored = localStorage.getItem(`chatpad_user_${agentId}`);
    return stored ? JSON.parse(stored) : null;
  });
  
  const [isTyping, setIsTyping] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isAttachingFiles, setIsAttachingFiles] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<any>(null);
  const [messageInput, setMessageInput] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [pendingFiles, setPendingFiles] = useState<Array<{ file: File; preview: string }>>([]);
  const [formLoadTime] = useState(() => Date.now()); // Spam protection: track when form rendered
  
  const [helpSearchQuery, setHelpSearchQuery] = useState('');
  const [articleFeedback, setArticleFeedback] = useState<'helpful' | 'not_helpful' | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showFeedbackComment, setShowFeedbackComment] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  
  const [isHumanTakeover, setIsHumanTakeover] = useState(false);
  const [isHumanTyping, setIsHumanTyping] = useState(false);
  const [typingAgentName, setTypingAgentName] = useState<string | undefined>();
  const [takeoverAgentName, setTakeoverAgentName] = useState<string | undefined>();
  const [takeoverAgentAvatar, setTakeoverAgentAvatar] = useState<string | undefined>();
  const [unreadCount, setUnreadCount] = useState(0);
  const [headerScrollY, setHeaderScrollY] = useState(0);
  const homeContentRef = useRef<HTMLDivElement>(null);
  
  // Visitor ID state
  const [visitorId] = useState(() => {
    const stored = localStorage.getItem(`chatpad_visitor_id_${agentId}`);
    if (stored) return stored;
    const newId = `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(`chatpad_visitor_id_${agentId}`, newId);
    return newId;
  });

  // Track hover state for nav icons
  const [hoveredNav, setHoveredNav] = useState<'home' | 'messages' | 'help' | null>(null);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  // Sound settings via extracted hook
  const { soundEnabled, setSoundEnabled, playNotificationSound } = useSoundSettings(agentId);

  // Conversation management via extracted hook
  const {
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
  } = useConversations({
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
  } = useVisitorAnalytics({
    agentId,
    visitorId,
    previewMode,
    activeConversationId,
  });

  // Parent window communication via extracted hook
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

  // Update greeting when config changes in preview mode
  useEffect(() => {
    if (previewMode && config && messages.length > 0) {
      const firstMsg = messages[0];
      if (firstMsg && firstMsg.role === 'assistant') {
        setMessages(prev => [
          { ...firstMsg, content: config.greeting },
          ...prev.slice(1)
        ]);
      }
    }
  }, [config?.greeting, previewMode]);

  // Scroll to bottom when file attachment opens
  useEffect(() => {
    if (isAttachingFiles && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isAttachingFiles]);

  // Immediately clear parent badge when widget opens
  useEffect(() => {
    if (isOpen && window.parent !== window) {
      notifyUnreadCount(0);
    }
  }, [isOpen, notifyUnreadCount]);

  // Calculate and notify unread count
  useEffect(() => {
    // Get last read timestamp from localStorage for this conversation
    const readKey = `chatpad_last_read_${agentId}_${activeConversationId}`;
    const lastReadTimestamp = localStorage.getItem(readKey);
    const lastReadDate = lastReadTimestamp ? new Date(lastReadTimestamp) : null;
    
    // Count unread messages (assistant messages that arrived after last read)
    const unread = messages.filter(m => {
      if (m.role !== 'assistant') return false;
      if (m.read) return false;
      if (lastReadDate && m.timestamp <= lastReadDate) return false;
      return true;
    }).length;
    
    setUnreadCount(unread);
    
    // Notify parent window of unread count for badge display
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
  }, [messages, currentView, selectedArticle, chatUser, previewMode]);

  // Only return null for simple config loading, not when parent handles config (instant loading)
  if (!parentHandlesConfig && (loading || !config)) return null;

  // Calculate logo opacity based on scroll (graceful fade over 120px with easing)
  const logoOpacity = Math.max(0, 1 - Math.pow(headerScrollY / 120, 1.5));

  const getGradientStyle = () => {
    if (!config.useGradientHeader) return { backgroundColor: config.primaryColor };
    return { background: `linear-gradient(135deg, ${config.gradientStartColor} 0%, ${config.gradientEndColor} 100%)` };
  };

  const getQuickActionIcon = (icon: string) => {
    switch (icon) {
      case 'chat': return <MessageChatCircle className="h-5 w-5" />;
      case 'help': return <BookOpen01 className="h-5 w-5" />;
      case 'bug': return <Zap className="h-5 w-5" />;
      case 'feature': return <Zap className="h-5 w-5" />;
      case 'contact': return <MessageChatCircle className="h-5 w-5" />;
      default: return <MessageChatCircle className="h-5 w-5" />;
    }
  };

  const handleQuickActionClick = (actionType: string) => {
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
  };

  const handleStartNewConversation = () => {
    const newConvId = 'conv_' + Date.now();
    setActiveConversationId(newConvId);
    setShowConversationList(false);
    if (chatUser) {
      setMessages([{ role: 'assistant', content: `Welcome back, ${chatUser.firstName}! 👋 How can I help you today?`, read: true, timestamp: new Date(), type: 'text', reactions: [] }]);
    } else {
      setMessages([]);
    }
  };

  const handleOpenConversation = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      isOpeningConversationRef.current = true;
      setActiveConversationId(conversationId);
      
      const messagesWithRead = conversation.messages.map(m => 
        m.role === 'assistant' ? { ...m, read: true } : m
      );
      setMessages(messagesWithRead);
      setShowConversationList(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() && pendingFiles.length === 0) return;

    const userContent = pendingFiles.length > 0 ? (messageInput || 'Sent files') : messageInput;
    
    const newMessage: Message = {
      role: 'user',
      content: userContent,
      read: false,
      timestamp: new Date(),
      type: pendingFiles.length > 0 ? 'file' : 'text',
      files: pendingFiles.length > 0 ? pendingFiles.map(pf => ({ name: pf.file.name, url: pf.preview, type: pf.file.type, size: pf.file.size })) : undefined,
      reactions: [],
    };
    
    setMessages(prev => [...prev, newMessage]);
    setPendingFiles([]);
    setMessageInput('');
    setIsTyping(true);

    try {
      const messageHistory = [...messages, newMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      let finalPageVisits = [...pageVisits];
      if (currentPageRef.current.url && currentPageRef.current.entered_at) {
        const duration = Date.now() - new Date(currentPageRef.current.entered_at).getTime();
        const lastIndex = finalPageVisits.findIndex(v => v.url === currentPageRef.current.url && v.duration_ms === 0);
        if (lastIndex !== -1) {
          finalPageVisits[lastIndex] = { ...finalPageVisits[lastIndex], duration_ms: duration };
        }
        setPageVisits(finalPageVisits);
      }

      console.log('[Widget] Sending message with:', {
        pageVisitsCount: finalPageVisits.length,
        referrerJourney: referrerJourney ? 'present' : 'null',
        conversationId: activeConversationId,
      });

      const response = await sendChatMessage(
        config.agentId,
        activeConversationId,
        messageHistory,
        chatUser?.leadId,
        finalPageVisits.length > 0 ? finalPageVisits : undefined,
        referrerJourney || undefined,
        visitorId
      );

      if (response.conversationId && response.conversationId !== activeConversationId) {
        const oldConvId = activeConversationId;
        setActiveConversationId(response.conversationId);
        
        if (chatUser) {
          const updatedUser = { ...chatUser, conversationId: response.conversationId };
          setChatUser(updatedUser);
          localStorage.setItem(`chatpad_user_${config.agentId}`, JSON.stringify(updatedUser));
        }
        
        if (oldConvId) {
          setConversations(prev => prev.map(conv => 
            conv.id === oldConvId 
              ? { ...conv, id: response.conversationId } 
              : conv
          ));
        }
      }

      if (response.status === 'human_takeover') {
        setIsHumanTakeover(true);
        if (response.takenOverBy) {
          setTakeoverAgentName(response.takenOverBy.name);
          setTakeoverAgentAvatar(response.takenOverBy.avatar);
        }
        if (response.userMessageId) {
          setMessages(prev => {
            const updated = [...prev];
            for (let i = updated.length - 1; i >= 0; i--) {
              if (updated[i].role === 'user' && !updated[i].id) {
                updated[i] = { ...updated[i], id: response.userMessageId };
                break;
              }
            }
            return updated;
          });
        }
      } else if (response.response) {
        if (response.userMessageId) {
          setMessages(prev => {
            const updated = [...prev];
            for (let i = updated.length - 1; i >= 0; i--) {
              if (updated[i].role === 'user' && !updated[i].id) {
                updated[i] = { ...updated[i], id: response.userMessageId };
                break;
              }
            }
            return updated;
          });
        }
        
        setMessages(prev => [...prev, { 
          id: response.assistantMessageId,
          role: 'assistant', 
          content: response.response, 
          read: isOpen && currentView === 'messages', 
          timestamp: new Date(), 
          type: 'text', 
          reactions: [],
          linkPreviews: response.linkPreviews,
        }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.', 
        read: true, 
        timestamp: new Date(), 
        type: 'text', 
        reactions: [] 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setMessages(prev => [...prev, { role: 'user', content: 'Voice message', read: false, timestamp: new Date(), type: 'audio', audioUrl, reactions: [] }]);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingAudio(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const cancelAudioRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
    }
    setIsRecordingAudio(false);
    setRecordingTime(0);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    chunksRef.current = [];
  };

  const removeFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitFeedback = async () => {
    if (!selectedArticle || articleFeedback === null) return;
    try {
      const sessionId = getSessionId();
      await submitArticleFeedback(selectedArticle.id, { sessionId, isHelpful: articleFeedback === 'helpful', comment: feedbackComment });
      setFeedbackSubmitted(true);
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
    }
  };

  const filteredArticles = config.helpArticles.filter(article => {
    const matchesSearch = !helpSearchQuery || article.title.toLowerCase().includes(helpSearchQuery.toLowerCase()) || article.content.toLowerCase().includes(helpSearchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || article.category_id === selectedCategory || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const position = (config.position || 'bottom-right') as keyof typeof positionClasses;
  
  // Detect iframe mode (embedded widget)
  const isIframeMode = !previewMode && window.parent !== window;

  // Close button handler for iframe mode
  const handleClose = () => {
    setIsOpen(false);
    if (isIframeMode) {
      notifyClose();
    }
  };

  // Loading state - use simple CSS spinner to keep bundle small
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

  // Shared widget content
  const widgetContent = (
    <div id="chatpad-widget-root" className="h-full bg-transparent">
      {isOpen || isIframeMode ? (
          <Card 
            className={isIframeMode 
              ? `w-full h-full flex flex-col shadow-none overflow-hidden border-0 ${isMobileFullScreen ? '' : 'rounded-3xl'}` 
              : "w-[380px] h-[650px] flex flex-col shadow-xl overflow-hidden border-0 rounded-3xl"}
            style={{
              background: currentView === 'home' 
                ? `linear-gradient(to bottom right, ${config.gradientStartColor}, ${config.gradientEndColor})`
                : undefined
            }}
          >
            {/* Header */}
            {currentView === 'home' ? (
              <div className="flex-1 relative overflow-hidden">
                {/* Fixed gradient background - extends full height */}
                <div className="absolute inset-0">
                  {/* Only render BubbleBackground when widget is visible to save GPU resources */}
                  {(isOpen || isIframeMode) && (
                    <CSSBubbleBackground 
                      colors={generateGradientPalette(config.gradientStartColor, config.gradientEndColor)}
                      baseGradient={{
                        from: hexToRgb(config.gradientStartColor),
                        to: hexToRgb(config.gradientEndColor)
                      }}
                      className="absolute inset-0"
                      style={{
                        maskImage: 'linear-gradient(to bottom, black 0%, black 35%, transparent 65%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 35%, transparent 65%)'
                      }}
                    />
                  )}
                  
                  
                  {/* Logo in top left - aligned with content text */}
                  <ChatPadLogo 
                    className="absolute top-4 left-6 h-8 w-8 text-white transition-opacity duration-300 z-10"
                    style={{ opacity: logoOpacity }}
                  />
                  
                  {/* Close button in top right */}
                  <div className="absolute top-4 right-4 z-30">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white h-8 w-8" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
                  </div>
                </div>
                
                {/* Scrollable content overlay */}
                <div 
                  ref={homeContentRef}
                  onScroll={(e) => setHeaderScrollY(e.currentTarget.scrollTop)}
                  className="absolute inset-0 overflow-y-auto z-10 flex flex-col"
                >
                  {/* Spacer to push content down initially - shows gradient */}
                  <div className="h-[140px]" />
                  
                  {/* Welcome text - visible over gradient, fades on scroll */}
                  <div 
                    className="px-6 pb-6 transition-opacity duration-300"
                    style={{ opacity: logoOpacity }}
                  >
                    <h2 className="text-xl font-semibold text-white">
                      {isContentLoading ? (
                        <span className="inline-block w-32 h-6 bg-white/20 rounded animate-pulse" />
                      ) : (
                        config.greeting
                      )}
                    </h2>
                  </div>
                  
                  {/* Content area with white background */}
                  <div className="bg-white rounded-t-2xl flex-1 min-h-[300px]">
                    <div className="p-5 space-y-4">
                      {isContentLoading ? (
                        // Skeleton loading state
                        <div className="space-y-3">
                          {[1, 2].map((i) => (
                            <div key={i} className="p-4 border rounded-lg animate-pulse">
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-muted w-10 h-10" />
                                <div className="flex-1 space-y-2">
                                  <div className="h-4 bg-muted rounded w-24" />
                                  <div className="h-3 bg-muted rounded w-40" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          {/* Announcements - show if there are active announcements */}
                          {config.announcements && config.announcements.length > 0 && (
                            <CSSAnimatedList className="space-y-3" staggerDelay={0.1}>
                              {config.announcements.map((announcement) => (
                                <CSSAnimatedItem key={announcement.id}>
                                  <div 
                                    className="rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
                                    style={{ 
                                      backgroundColor: announcement.background_color || config.primaryColor,
                                    }}
                                    onClick={() => {
                                      if (announcement.action_type === 'open_url' && announcement.action_url) {
                                        window.open(announcement.action_url, '_blank', 'noopener,noreferrer');
                                      } else if (announcement.action_type === 'start_chat') {
                                        handleQuickActionClick('start_chat');
                                      }
                                    }}
                                  >
                                   <div className="p-4 flex items-center gap-4">
                                     {announcement.image_url && (
                                       <img 
                                         src={announcement.image_url} 
                                         alt="" 
                                         className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                       />
                                     )}
                                     <div className="flex-1 min-w-0">
                                       <h4 
                                         className="font-semibold text-sm truncate"
                                         style={{ color: announcement.title_color || '#ffffff' }}
                                       >
                                         {announcement.title}
                                       </h4>
                                       {announcement.subtitle && (
                                         <p 
                                           className="text-xs mt-0.5 truncate opacity-90"
                                           style={{ color: announcement.title_color || '#ffffff' }}
                                         >
                                           {announcement.subtitle}
                                         </p>
                                       )}
                                     </div>
                                     <ChevronRight 
                                       className="h-5 w-5 flex-shrink-0 opacity-70"
                                       style={{ color: announcement.title_color || '#ffffff' }}
                                     />
                                    </div>
                                   </div>
                                  </CSSAnimatedItem>
                               ))}
                             </CSSAnimatedList>
                           )}

                          <CSSAnimatedList className="space-y-3" staggerDelay={0.1}>
                            {config.quickActions.map((action) => (
                              <CSSAnimatedItem key={action.id}>
                                <div
                                  className="p-4 border rounded-lg bg-card hover:bg-accent/50 cursor-pointer transition-all"
                                  onClick={() => handleQuickActionClick(action.action || action.actionType)}
                                >
                                <div className="flex items-start gap-3">
                                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${config.primaryColor}15` }}>
                                    <div style={{ color: config.primaryColor }}>{getQuickActionIcon(action.icon)}</div>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <h4 className="font-medium text-sm">{action.title || action.label}</h4>
                                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    {action.subtitle && (
                                      <p className="text-xs text-muted-foreground mt-0.5">{action.subtitle}</p>
                                    )}
                                  </div>
                                 </div>
                                </div>
                              </CSSAnimatedItem>
                            ))}
                          </CSSAnimatedList>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {config.showBranding && (
                    <div className="text-center py-2 mt-auto bg-white border-t">
                      <span className="text-xs text-muted-foreground inline-flex items-center">
                        Powered by
                        <a 
                          href="https://pad.chat" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-0.5 ml-1"
                        >
                          <ChatPadLogo className="h-3 w-3" /> ChatPad
                        </a>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 flex items-center justify-between relative bg-background border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${config.primaryColor}15` }}>
                    <ChatBubbleIcon className="h-6 w-6" style={{ color: config.primaryColor }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{currentView === 'messages' ? config.agentName : 'Help Center'}</h3>
                    <div className="flex items-center gap-1.5">
                      <div className="relative flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <div className="absolute w-2 h-2 bg-green-500 rounded-full animate-pulse-slow" />
                      </div>
                      <p className="text-xs text-muted-foreground">Online</p>
                    </div>
                  </div>
                </div>
              <div className="flex items-center gap-1 relative">
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground hover:text-foreground hover:bg-transparent h-8 w-8" 
                    onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                  >
                    <Settings01 className="h-4 w-4" />
                  </Button>
                  {showSettingsDropdown && (
                    <div className="absolute right-0 top-full mt-1 bg-card border rounded-lg shadow-lg p-2 z-50 min-w-[180px]">
                      <button
                        onClick={() => {
                          setSoundEnabled(!soundEnabled);
                          setShowSettingsDropdown(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                      >
                        {soundEnabled ? (
                          <VolumeMax className="h-4 w-4" />
                        ) : (
                          <VolumeX className="h-4 w-4" />
                        )}
                        <span>Sound {soundEnabled ? 'On' : 'Off'}</span>
                      </button>
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-transparent h-8 w-8" onClick={handleClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              </div>
            )}

            {/* Content - Only for non-home views */}
            {currentView !== 'home' && (
              <div className="flex-1 overflow-hidden bg-background flex flex-col min-h-0">

              {currentView === 'messages' && (
                <div className="flex-1 flex flex-col widget-view-enter min-h-0">
                  {/* Conversation List View - for returning users */}
                  {showConversationList && chatUser && (
                    <div className="flex-1 flex flex-col">
                      <div className="flex-1 overflow-y-auto p-4">
                        {conversations.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <MessageChatCircle className="h-12 w-12 text-muted-foreground mb-3" />
                            <p className="text-sm text-muted-foreground">No conversations yet</p>
                            <p className="text-xs text-muted-foreground mt-1">Start a new conversation below</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {conversations.map((conversation) => (
                              <div
                                key={conversation.id}
                                onClick={() => handleOpenConversation(conversation.id)}
                                className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                              >
                                <div className="flex items-start gap-2">
                                  <MessageChatCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{conversation.preview}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {formatTimestamp(new Date(conversation.updatedAt))}
                                    </p>
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Start New Conversation Button - Black styling */}
                      <div className="p-4 border-t">
                        <Button
                          onClick={handleStartNewConversation}
                          className="w-full bg-black text-white hover:bg-black/90"
                        >
                          <MessageChatCircle className="h-4 w-4 mr-2" />
                          Start New Conversation
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Chat View - show contact form for new users OR active conversation */}
                  {!showConversationList && (
                    <>
                      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 messages-container min-h-0">
                        {!chatUser && config.enableContactForm && (
                      <div className="flex items-start">
                        <div className="bg-muted rounded-lg p-3 w-full">
                          <p className="text-base font-semibold mb-1.5">{config.contactFormTitle || 'Quick intro before we chat 👋'}</p>
                          {config.contactFormSubtitle && (
                            <p className="text-sm text-muted-foreground mb-4">{config.contactFormSubtitle}</p>
                          )}
                          <form 
                            className="space-y-2"
                            onSubmit={async (e) => {
                              e.preventDefault();
                              const formData = new FormData(e.currentTarget);
                              const firstName = formData.get('firstName') as string;
                              const lastName = formData.get('lastName') as string;
                              const email = formData.get('email') as string;
                              const honeypot = formData.get('website') as string;
                              const customFieldData: Record<string, any> = {};

                              if (honeypot) {
                                console.log('Spam detected: honeypot filled');
                                return;
                              }

                              config.customFields.forEach(field => {
                                const value = formData.get(field.id);
                                if (value) {
                                  customFieldData[field.label] = value;
                                }
                              });

                              try {
                                const errors: Record<string, string> = {};
                                const trimmedFirstName = firstName.trim();
                                const trimmedLastName = lastName.trim();
                                const trimmedEmail = email.trim();
                                
                                if (!trimmedFirstName || trimmedFirstName.length > 50) {
                                  errors.firstName = 'First name is required (max 50 chars)';
                                }
                                if (!trimmedLastName || trimmedLastName.length > 50) {
                                  errors.lastName = 'Last name is required (max 50 chars)';
                                }
                                if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail) || trimmedEmail.length > 255) {
                                  errors.email = 'Valid email is required';
                                }
                                
                                if (Object.keys(errors).length > 0) {
                                  setFormErrors(errors);
                                  return;
                                }
                                setFormErrors({});

                                const { leadId, conversationId } = await createLead(config.agentId, { firstName: trimmedFirstName, lastName: trimmedLastName, email: trimmedEmail, customFields: customFieldData, _formLoadTime: formLoadTime });
                                const userData = { firstName: trimmedFirstName, lastName: trimmedLastName, email: trimmedEmail, leadId, conversationId: conversationId || undefined };
                                localStorage.setItem(`chatpad_user_${config.agentId}`, JSON.stringify(userData));
                                setChatUser(userData);
                                setMessages([{ role: 'assistant', content: config.greeting, read: true, timestamp: new Date(), type: 'text', reactions: [] }]);
                                setActiveConversationId(conversationId || 'new');
                              } catch (error) {
                                console.error('Error creating lead:', error);
                               }
                             }}
                          >
                            {/* Honeypot field - hidden from users, bots fill it */}
                            <input 
                              name="website" 
                              type="text" 
                              tabIndex={-1} 
                              autoComplete="off"
                              className="absolute -left-[9999px] h-0 w-0 opacity-0 pointer-events-none"
                              aria-hidden="true"
                            />
                            <Input name="firstName" placeholder="First name" className="h-8 text-sm" required />
                            {formErrors.firstName && <p className="text-xs text-destructive">{formErrors.firstName}</p>}
                            <Input name="lastName" placeholder="Last name" className="h-8 text-sm" required />
                            {formErrors.lastName && <p className="text-xs text-destructive">{formErrors.lastName}</p>}
                            <Input name="email" type="email" placeholder="Email" className="h-8 text-sm" required />
                            {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
                            
                            {config.customFields.map(field => (
                              <div key={field.id}>
                                {field.fieldType === 'select' ? (
                                  <Select name={field.id} required={field.required}>
                                    <SelectTrigger className="h-8 text-sm">
                                      <SelectValue placeholder={field.label} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {field.options?.map(opt => (
                                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : field.fieldType === 'textarea' ? (
                                  <Textarea name={field.id} placeholder={field.label} className="text-sm" required={field.required} />
                                ) : field.fieldType === 'phone' ? (
                                  <Suspense fallback={<Input placeholder={field.label} className="h-8 text-sm" disabled />}>
                                    <PhoneInputField 
                                      name={field.id}
                                      placeholder={field.label}
                                      className="h-8 text-sm"
                                      required={field.required}
                                    />
                                  </Suspense>
                                ) : (
                                  <Input name={field.id} type={field.fieldType === 'email' ? 'email' : 'text'} placeholder={field.label} className="h-8 text-sm" required={field.required} />
                                )}
                              </div>
                            ))}
                            
                            <Button type="submit" size="sm" className="w-full h-8" style={{ backgroundColor: config.primaryColor }}>
                              Start Chat
                            </Button>
                          </form>
                        </div>
                      </div>
                    )}
                    
                    {!chatUser && !config.enableContactForm && messages.length === 0 && (
                      <div className="flex items-start">
                        <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                          <p className="text-sm whitespace-pre-wrap break-words">{config.greeting}</p>
                        </div>
                      </div>
                    )}


                    {messages.map((msg, idx) => {
                      const msgWithExtras = msg as Message & { isHuman?: boolean; senderName?: string; senderAvatar?: string };
                      
                      // System notices render differently - centered, no avatar, no timestamp
                      if (msg.isSystemNotice) {
                        return (
                          <div key={idx} className="flex justify-center py-2">
                            <p className="text-xs text-muted-foreground italic text-center">
                              {msg.content}
                            </p>
                          </div>
                        );
                      }
                      
                      return (
                      <div key={idx} className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'assistant' && (
                          msgWithExtras.isHuman && msgWithExtras.senderAvatar ? (
                            <Avatar className="w-7 h-7 flex-shrink-0">
                              <AvatarImage src={msgWithExtras.senderAvatar} alt={msgWithExtras.senderName || 'Team member'} />
                              <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                                {(msgWithExtras.senderName || 'T')[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${config.primaryColor}15` }}>
                              <ChatBubbleIcon className="h-4 w-4" style={{ color: config.primaryColor }} />
                            </div>
                          )
                        )}
                        <div className="flex flex-col gap-1 max-w-[80%]">
                          {/* Human agent label */}
                          {msg.role === 'assistant' && msgWithExtras.isHuman && msgWithExtras.senderName && (
                            <span className="text-xs text-blue-600 font-medium">
                              {msgWithExtras.senderName}
                            </span>
                          )}
                          <div 
                            className={`rounded-lg p-3 ${
                              msg.role === 'user' 
                                ? 'text-foreground' 
                                : msgWithExtras.isHuman 
                                  ? 'bg-muted/50' 
                                  : 'bg-muted'
                            }`}
                            style={msg.role === 'user' ? { 
                              backgroundColor: `${config.primaryColor}12`
                            } : undefined}
                          >
                            {msg.type === 'audio' && msg.audioUrl && (
                              <Suspense fallback={<div className="h-8 flex items-center text-sm text-muted-foreground">Loading audio...</div>}>
                                <AudioPlayer src={msg.audioUrl} />
                              </Suspense>
                            )}
                            {msg.type === 'file' && msg.files && (
                              <div className="space-y-2">
                                {msg.files.map((file, i) => (
                                  <div key={i} className="flex items-center gap-2">
                                    {file.type?.startsWith('image/') ? (
                                      <img src={file.url} alt={file.name} className="max-w-full rounded-lg" />
                                    ) : (
                                      <div className="flex items-center gap-2 text-sm">
                                        <FileCheck02 className="h-4 w-4" />
                                        <span>{file.name}</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {msg.content && msg.content !== 'Sent files' && (
                                  <p className="text-sm whitespace-pre-wrap break-words mt-2">{msg.content}</p>
                                )}
                              </div>
                            )}
                            {(msg.type === 'text' || !msg.type) && (
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            )}
                            
                            {/* Link previews for assistant messages */}
                            {msg.role === 'assistant' && msg.linkPreviews && msg.linkPreviews.length > 0 && (
                              <div className="mt-2">
                                <LinkPreviews content={msg.content} cachedPreviews={msg.linkPreviews} />
                              </div>
                            )}
                          </div>
                          
                          {/* Message footer: timestamp + read receipt + reactions */}
                          <div className="flex items-center gap-2 px-1">
                            <span className="text-[10px] text-muted-foreground">
                              {formatTimestamp(msg.timestamp)}
                            </span>
                            
                            {/* Read receipt for user messages */}
                            {msg.role === 'user' && (
                              <div className="flex items-center" title={msg.read_at ? 'Read' : 'Sent'}>
                                <Check className={`h-3 w-3 ${msg.read_at ? 'text-blue-500' : 'text-muted-foreground'}`} />
                              </div>
                            )}
                            
                            {/* Emoji reactions */}
                            {config.enableMessageReactions && msg.id && (
                              <Suspense fallback={null}>
                                <MessageReactions
                                  reactions={msg.reactions || []}
                                  onReactionChange={async (emoji, add) => {
                                    try {
                                      await updateMessageReaction(msg.id!, emoji, add);
                                      // Optimistically update local state
                                      setMessages(prev => prev.map(m => {
                                        if (m.id !== msg.id) return m;
                                        const existing = m.reactions || [];
                                        const reactionIndex = existing.findIndex(r => r.emoji === emoji);
                                        if (add) {
                                          if (reactionIndex >= 0) {
                                            const updated = [...existing];
                                            updated[reactionIndex] = { ...updated[reactionIndex], userReacted: true, count: updated[reactionIndex].count + 1 };
                                            return { ...m, reactions: updated };
                                          }
                                          return { ...m, reactions: [...existing, { emoji, count: 1, userReacted: true }] };
                                        } else {
                                          if (reactionIndex >= 0) {
                                            const updated = [...existing];
                                            if (updated[reactionIndex].count <= 1) {
                                              updated.splice(reactionIndex, 1);
                                            } else {
                                              updated[reactionIndex] = { ...updated[reactionIndex], userReacted: false, count: updated[reactionIndex].count - 1 };
                                            }
                                            return { ...m, reactions: updated };
                                          }
                                        }
                                        return m;
                                      }));
                                    } catch (err) {
                                      console.error('Failed to update reaction:', err);
                                    }
                                  }}
                                  compact
                                />
                              </Suspense>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                    })}

                    {/* Takeover banner when human has joined */}
                    {isHumanTakeover && (
                      <div className="flex items-center justify-center gap-2 py-2 px-3 bg-blue-50 rounded-lg border border-blue-200">
                        {takeoverAgentAvatar ? (
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={takeoverAgentAvatar} alt={takeoverAgentName} />
                            <AvatarFallback className="text-[10px] bg-blue-100 text-blue-600">
                              {(takeoverAgentName || 'T')[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ) : null}
                        <span className="text-xs text-blue-700">
                          You're now chatting with {takeoverAgentName || 'a team member'}
                        </span>
                      </div>
                    )}

                    {/* Typing indicator - show human typing OR AI typing */}
                    {(isTyping || isHumanTyping) && (
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${config.primaryColor}15` }}>
                          <ChatBubbleIcon className="h-4 w-4" style={{ color: config.primaryColor }} />
                        </div>
                        <div className="bg-muted rounded-lg p-3">
                          <div className="flex items-center gap-1.5">
                            {isHumanTyping && typingAgentName && (
                              <span className="text-xs text-blue-600 font-medium mr-1">{typingAgentName}</span>
                            )}
                            <div className="flex gap-1">
                              <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                              <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                              <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* File attachment overlay */}
                    {isAttachingFiles && (
                      <div className="p-4">
                        <Suspense fallback={<div className="h-32 flex items-center justify-center text-muted-foreground text-sm">Loading...</div>}>
                          <FileDropZone
                            onFilesSelected={(files, urls) => {
                              files.forEach((file, i) => {
                                setPendingFiles(prev => [...prev, { file, preview: urls[i] || '' }]);
                              });
                              setIsAttachingFiles(false);
                            }}
                            onCancel={() => setIsAttachingFiles(false)}
                            primaryColor={config.primaryColor}
                          />
                        </Suspense>
                      </div>
                    )}
                    {/* Scroll anchor for auto-scroll */}
                    <div ref={messagesEndRef} />
                  </div>

                  {pendingFiles.length > 0 && (
                    <div className="p-2 border-t flex gap-2 overflow-x-auto">
                      {pendingFiles.map((pf, i) => (
                        <div key={i} className="relative group flex-shrink-0">
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
                            {pf.preview ? (
                              <img src={pf.preview} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <FileCheck02 className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <Button 
                              size="icon"
                              variant="destructive"
                              onClick={() => removeFile(i)} 
                              className="absolute -top-1 -right-1 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  

                  <div className="p-3 border-t">
                    {isRecordingAudio ? (
                      <div className="flex items-center justify-center gap-3">
                        <Suspense fallback={<div className="h-12 flex items-center justify-center text-muted-foreground text-sm">Loading...</div>}>
                          <VoiceInput
                            isRecording={isRecordingAudio}
                            recordingTime={recordingTime}
                            onStop={stopAudioRecording}
                            onCancel={cancelAudioRecording}
                          />
                        </Suspense>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder={config.placeholder || 'Type a message...'}
                          disabled={!chatUser && config.enableContactForm}
                          className={`flex-1 h-9 text-sm placeholder:text-xs ${!chatUser && config.enableContactForm ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        {config.enableFileAttachments && (
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => setIsAttachingFiles(true)}
                            disabled={!chatUser && config.enableContactForm}
                            className={!chatUser && config.enableContactForm ? 'opacity-50 cursor-not-allowed' : ''}
                          >
                            <Attachment01 className="h-4 w-4" />
                          </Button>
                        )}
                        {config.enableVoiceMessages && (
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={startAudioRecording}
                            disabled={!chatUser && config.enableContactForm}
                            className={!chatUser && config.enableContactForm ? 'opacity-50 cursor-not-allowed' : ''}
                          >
                            <Microphone01 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          size="icon" 
                          className={`h-9 w-9 ${!chatUser && config.enableContactForm ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={handleSendMessage} 
                          disabled={!chatUser && config.enableContactForm}
                          style={{ backgroundColor: config.primaryColor }}
                        >
                          <Send01 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {currentView === 'help' && (
                <div className="flex-1 flex flex-col overflow-hidden widget-view-enter">
                  {/* Level 1: Categories List / Search Results (No category selected) */}
                  {!selectedCategory && !selectedArticle && (
                    <>
                      <div className="p-4 border-b bg-muted/50">
                        {helpSearchQuery ? (
                          <div className="flex items-center gap-2 mb-3">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => setHelpSearchQuery('')}
                              className="h-8"
                            >
                              <ChevronRight className="h-4 w-4 rotate-180" />
                            </Button>
                            <h3 className="text-lg font-semibold">Search Results</h3>
                          </div>
                        ) : (
                          <h3 className="text-lg font-semibold mb-3">Help Center</h3>
                        )}
                        <Input
                          value={helpSearchQuery}
                          onChange={(e) => setHelpSearchQuery(e.target.value)}
                          placeholder="Search help articles..."
                          className="h-9"
                        />
                      </div>

                      <div className="flex-1 overflow-y-auto p-4">
                        {helpSearchQuery ? (
                          // Search Results
                          filteredArticles.length === 0 ? (
                            <p className="text-center text-muted-foreground text-sm py-8 widget-animated-item">
                              No articles found
                            </p>
                          ) : (
                            <CSSAnimatedList className="space-y-2" staggerDelay={0.1}>
                              {filteredArticles.map((article) => (
                                <CSSAnimatedItem key={article.id}>
                                  <div
                                    className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                                    onClick={() => {
                                      setSelectedArticle(article);
                                      setHelpSearchQuery('');
                                    }}
                                  >
                                   <div className="flex items-start justify-between gap-2">
                                     <h4 className="font-medium text-sm flex-1">{article.title}</h4>
                                     {article.category && (
                                       <Badge variant="secondary" className="text-xs flex-shrink-0">
                                         {article.category}
                                       </Badge>
                                     )}
                                   </div>
                                  </div>
                                 </CSSAnimatedItem>
                              ))}
                            </CSSAnimatedList>
                          )
                        ) : (
                          // Categories List
                          config.helpCategories.length === 0 ? (
                            <p className="text-center text-muted-foreground text-sm py-8 widget-animated-item">
                              No categories available
                            </p>
                          ) : (
                            <CSSAnimatedList className="space-y-3" staggerDelay={0.1}>
                              {config.helpCategories.map((category) => {
                                const articlesInCategory = config.helpArticles.filter(
                                  a => a.category_id === category.id || a.category === category.name
                                ).length;
                                
                                return (
                                  <CSSAnimatedItem key={category.id}>
                                    <button
                                      className="w-full p-4 border rounded-lg bg-card hover:bg-accent/50 cursor-pointer transition-all text-left active:scale-[0.98]"
                                      onClick={() => setSelectedCategory(category.id)}
                                    >
                                    <div className="flex items-center gap-3">
                                      <div 
                                        className="p-2.5 rounded-lg flex-shrink-0"
                                        style={{ backgroundColor: `${config.gradientStartColor}15` }}
                                      >
                                        <CategoryIcon 
                                          name={category.icon} 
                                          className="h-5 w-5" 
                                          style={{ color: config.gradientStartColor }}
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-sm">{category.name}</h4>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {articlesInCategory} {articlesInCategory === 1 ? 'article' : 'articles'}
                                        </p>
                                      </div>
                                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                    </div>
                                    </button>
                                  </CSSAnimatedItem>
                                );
                              })}
                            </CSSAnimatedList>
                          )
                        )}
                      </div>
                    </>
                  )}

                  {/* Level 2: Articles in Category (Category selected, no article) */}
                  {selectedCategory && !selectedArticle && (
                    <>
                      <div className="p-4 border-b bg-muted/50">
                        <div className="flex items-center gap-2 mb-3">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => {
                              setSelectedCategory(null);
                              setHelpSearchQuery('');
                            }}
                            className="h-8"
                          >
                            <ChevronRight className="h-4 w-4 rotate-180" />
                          </Button>
                          <h3 className="text-lg font-semibold">
                            {config.helpCategories.find(c => c.id === selectedCategory)?.name || 'Articles'}
                          </h3>
                        </div>
                        <Input
                          value={helpSearchQuery}
                          onChange={(e) => setHelpSearchQuery(e.target.value)}
                          placeholder="Search in this category..."
                          className="h-9"
                        />
                      </div>

                      <div className="flex-1 overflow-y-auto p-4">
                        {filteredArticles.length === 0 ? (
                          <p className="text-center text-muted-foreground text-sm py-8 widget-animated-item">
                            No articles in this category
                          </p>
                        ) : (
                          <CSSAnimatedList className="space-y-2" staggerDelay={0.1}>
                            {filteredArticles.map((article) => (
                              <CSSAnimatedItem key={article.id}>
                                <button
                                  className="w-full p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors text-left active:scale-[0.98]"
                                  onClick={() => setSelectedArticle(article)}
                                >
                                 <div className="flex items-center justify-between gap-2">
                                   <h4 className="font-medium text-sm flex-1">{article.title}</h4>
                                   <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                 </div>
                                </button>
                              </CSSAnimatedItem>
                            ))}
                          </CSSAnimatedList>
                        )}
                      </div>
                    </>
                  )}

                  {/* Level 3: Article Content with Feedback */}
                  {selectedArticle && (
                    <div className="flex-1 flex flex-col overflow-hidden widget-content-enter">
                      {/* Scrollable Article Content */}
                      <div className="flex-1 overflow-y-auto">
                        {/* Hero Section - Only shown if featured_image exists */}
                        {selectedArticle.featured_image ? (
                          <>
                            <div 
                              className="relative h-48 bg-cover bg-center"
                              style={{ backgroundImage: `url(${selectedArticle.featured_image})` }}
                            >
                              {/* Gradient Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
                              
                              {/* Back Button - Top Left */}
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => {
                                  setSelectedArticle(null);
                                  setArticleFeedback(null);
                                  setShowFeedbackComment(false);
                                  setFeedbackComment('');
                                  setFeedbackSubmitted(false);
                                }}
                                className="absolute top-3 left-3 text-white hover:bg-white/20 hover:text-white"
                              >
                                <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
                                Back
                              </Button>
                              
                              {/* Title - Bottom */}
                              <div className="absolute bottom-0 left-0 right-0 p-4">
                                <h2 className="text-xl font-bold text-white drop-shadow-lg">{selectedArticle.title}</h2>
                              </div>
                            </div>
                            
                            {/* Article Content below hero */}
                            <div className="p-4">
                              <div 
                                className="article-content max-w-none" 
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedArticle.content, {
                                  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'span', 'div', 'img'],
                                  ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'src', 'alt', 'width', 'height', 'style'],
                                }) }} 
                              />
                            </div>
                          </>
                        ) : (
                          /* Standard layout for articles without featured image */
                          <div className="p-4">
                            {/* Back button and title */}
                            <div className="flex items-center gap-2 mb-4">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => {
                                  setSelectedArticle(null);
                                  setArticleFeedback(null);
                                  setShowFeedbackComment(false);
                                  setFeedbackComment('');
                                  setFeedbackSubmitted(false);
                                }}
                                className="h-8"
                              >
                                <ChevronRight className="h-4 w-4 rotate-180" />
                              </Button>
                              <h2 className="text-lg font-semibold">{selectedArticle.title}</h2>
                            </div>
                            
                            {/* Article content */}
                            <div 
                              className="article-content max-w-none" 
                              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedArticle.content, {
                                ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'span', 'div', 'img'],
                                ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'src', 'alt', 'width', 'height', 'style'],
                              }) }} 
                            />
                          </div>
                        )}
                        
                        {/* Feedback Section - always at bottom of content */}
                        <div className="p-4 border-t bg-muted/30">
                          {feedbackSubmitted ? (
                            <div className="text-center py-4">
                              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                              <p className="text-sm font-medium">Thanks for your feedback!</p>
                              <p className="text-xs text-muted-foreground mt-1">Your input helps us improve.</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <p className="text-sm font-medium text-center">Was this article helpful?</p>
                              <div className="flex justify-center gap-3">
                                <Button
                                  size="sm"
                                  variant={articleFeedback === 'helpful' ? 'default' : 'outline'}
                                  onClick={() => {
                                    setArticleFeedback('helpful');
                                    setShowFeedbackComment(true);
                                  }}
                                  className="gap-1.5"
                                  style={articleFeedback === 'helpful' ? { backgroundColor: config.primaryColor } : undefined}
                                >
                                  <ThumbsUp className="h-4 w-4" />
                                  Yes
                                </Button>
                                <Button
                                  size="sm"
                                  variant={articleFeedback === 'not_helpful' ? 'default' : 'outline'}
                                  onClick={() => {
                                    setArticleFeedback('not_helpful');
                                    setShowFeedbackComment(true);
                                  }}
                                  className="gap-1.5"
                                  style={articleFeedback === 'not_helpful' ? { backgroundColor: config.primaryColor } : undefined}
                                >
                                  <ThumbsDown className="h-4 w-4" />
                                  No
                                </Button>
                              </div>
                              
                              {showFeedbackComment && (
                                <div className="space-y-2 mt-3">
                                  <Textarea
                                    value={feedbackComment}
                                    onChange={(e) => setFeedbackComment(e.target.value)}
                                    placeholder={articleFeedback === 'helpful' ? "What did you find most helpful? (optional)" : "How can we improve this article? (optional)"}
                                    className="text-sm resize-none"
                                    rows={3}
                                  />
                                  <Button
                                    size="sm"
                                    onClick={handleSubmitFeedback}
                                    className="w-full"
                                    style={{ backgroundColor: config.primaryColor }}
                                  >
                                    Submit Feedback
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              </div>
            )}

            {/* Bottom Navigation */}
            <div className="px-6 py-3 border-t bg-background flex justify-around items-center">
              <button
                onClick={() => setCurrentView('home')}
                onMouseEnter={() => setHoveredNav('home')}
                onMouseLeave={() => setHoveredNav(null)}
                className="flex flex-col items-center gap-1 py-1"
              >
                <HomeNavIcon 
                  isActive={currentView === 'home'} 
                  isHovered={hoveredNav === 'home'}
                  primaryColor={config.primaryColor}
                />
                <span className={`text-xs ${currentView === 'home' ? 'font-medium' : 'text-muted-foreground'}`} style={currentView === 'home' ? { color: config.primaryColor } : undefined}>
                  Home
                </span>
              </button>

              <button
                onClick={() => {
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
                }}
                onMouseEnter={() => setHoveredNav('messages')}
                onMouseLeave={() => setHoveredNav(null)}
                className="flex flex-col items-center gap-1 py-1 relative"
              >
                <div className="relative">
                  <ChatNavIcon 
                    isActive={currentView === 'messages'} 
                    isHovered={hoveredNav === 'messages'}
                    primaryColor={config.primaryColor}
                  />
                  {/* Unread badge */}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center px-1">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className={`text-xs ${currentView === 'messages' ? 'font-medium' : 'text-muted-foreground'}`} style={currentView === 'messages' ? { color: config.primaryColor } : undefined}>
                  Messages
                </span>
              </button>

              <button
                onClick={() => setCurrentView('help')}
                onMouseEnter={() => setHoveredNav('help')}
                onMouseLeave={() => setHoveredNav(null)}
                className="flex flex-col items-center gap-1 py-1"
              >
                <HelpNavIcon 
                  isActive={currentView === 'help'} 
                  isHovered={hoveredNav === 'help'}
                  primaryColor={config.primaryColor}
                />
                <span className={`text-xs ${currentView === 'help' ? 'font-medium' : 'text-muted-foreground'}`} style={currentView === 'help' ? { color: config.primaryColor } : undefined}>
                  Help
                </span>
              </button>
            </div>
          </Card>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-[50px] h-[50px] rounded-3xl flex items-center justify-center shadow-lg transition-transform hover:scale-105"
          style={getGradientStyle()}
        >
          <ChatPadLogo className="h-6 w-6 text-white" />
        </button>
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
      <div className="absolute" style={{ 
        ...positionClasses[position],
        right: position.includes('right') ? '16px' : undefined,
        left: position.includes('left') ? '16px' : undefined,
        bottom: position.includes('bottom') ? '16px' : undefined,
        top: position.includes('top') ? '16px' : undefined,
      }}>
        {widgetContent}
      </div>
    );
  }

  // Default mode: fixed positioning for standalone widget
  return (
    <div className="fixed z-[9999]" style={{ 
      ...positionClasses[position],
      right: position.includes('right') ? '16px' : undefined,
      left: position.includes('left') ? '16px' : undefined,
      bottom: position.includes('bottom') ? '16px' : undefined,
      top: position.includes('top') ? '16px' : undefined,
    }}>
      {widgetContent}
    </div>
  );
};
