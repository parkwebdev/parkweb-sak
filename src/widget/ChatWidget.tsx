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
import { useState, useEffect, useRef } from 'react';
import { createLead, sendChatMessage, submitConversationRating, type WidgetConfig, type ReferrerJourney } from './api';
import { supabase } from '@/integrations/supabase/client';

// Types and constants extracted for maintainability
import type { ViewType, ChatUser, Message, ChatWidgetProps } from './types';
import { WIDGET_CSS_VARS, getIsMobileFullScreen, positionClasses } from './constants';

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

// View Components
import { HomeView } from './views/HomeView';
import { ChatView } from './views/ChatView';
import { HelpView } from './views/HelpView';
import { NewsView } from './views/NewsView';

// UI Components
import { FloatingButton, WidgetHeader, WidgetNav, SatisfactionRating } from './components';
import { Card } from '@/components/ui/card';
import { TooltipProvider } from '@/components/ui/tooltip';

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
  const [pendingFiles, setPendingFiles] = useState<Array<{ file: File; preview: string }>>([]);
  const [formLoadTime] = useState(() => Date.now());
  
  const [isHumanTakeover, setIsHumanTakeover] = useState(false);
  const [isHumanTyping, setIsHumanTyping] = useState(false);
  const [typingAgentName, setTypingAgentName] = useState<string | undefined>();
  const [takeoverAgentName, setTakeoverAgentName] = useState<string | undefined>();
  const [takeoverAgentAvatar, setTakeoverAgentAvatar] = useState<string | undefined>();
  const [unreadCount, setUnreadCount] = useState(0);
  const [headerScrollY, setHeaderScrollY] = useState(0);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  
  // Satisfaction rating state
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  const [ratingTriggerType, setRatingTriggerType] = useState<'team_closed' | 'ai_marked_complete'>('ai_marked_complete');
  const hasShownRatingRef = useRef(false); // Track if rating has been shown this session
  
  // Refs for quick reply auto-send (must be before early return to maintain hooks order)
  const quickReplyPendingRef = useRef<string | null>(null);
  const handleSendMessageRef = useRef<(() => void) | null>(null);
  // Ref for tracking recently added chunk IDs to prevent realtime duplicates
  const recentChunkIdsRef = useRef<Set<string>>(new Set());
  // State for tracking new message IDs for slide-in animations
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());
  
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
      // Team member closed conversation - show rating prompt
      if (!hasShownRatingRef.current) {
        setRatingTriggerType('team_closed');
        setShowRatingPrompt(true);
        hasShownRatingRef.current = true;
      }
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

  // Preview mode greeting removed - AI generates personalized greetings now

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

  // Effect to auto-send quick reply (must be before early return to maintain hooks order)
  useEffect(() => {
    if (messageInput.trim() && !isActivelySendingRef.current) {
      const shouldAutoSend = quickReplyPendingRef.current === messageInput;
      if (shouldAutoSend) {
        quickReplyPendingRef.current = null;
        handleSendMessageRef.current?.();
      }
    }
  }, [messageInput]);

  // Only return null for simple config loading, not when parent handles config
  if (!parentHandlesConfig && (loading || !config)) return null;

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

  const handleMessagesClick = () => {
    if (!chatUser) {
      setActiveConversationId('new');
      setShowConversationList(false);
    } else {
      if (chatUser.conversationId) {
        setActiveConversationId(chatUser.conversationId);
      }
      setShowConversationList(true);
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
    isOpeningConversationRef.current = true;
    clearMessagesAndFetch(conversationId);
    setShowConversationList(false);
  };

  const handleSendMessage = async (overrideMessage?: string) => {
    const messageToSend = overrideMessage ?? messageInput;
    if (!messageToSend.trim() && pendingFiles.length === 0) return;

    // Mark as actively sending to prevent DB fetch from overwriting local messages
    isActivelySendingRef.current = true;

    const userContent = pendingFiles.length > 0 ? (messageToSend || 'Sent files') : messageToSend;
    
    // Upload files to Supabase storage and get real URLs
    let uploadedFiles: Array<{ name: string; url: string; type: string; size: number }> | undefined;
    if (pendingFiles.length > 0) {
      try {
        uploadedFiles = await Promise.all(
          pendingFiles.map(async (pf) => {
            const fileName = `widget/${activeConversationId || 'temp'}/${Date.now()}-${pf.file.name}`;
            const { data, error } = await supabase.storage
              .from('conversation-files')
              .upload(fileName, pf.file, { upsert: false });
            
            if (error) throw error;
            
            const { data: urlData } = supabase.storage
              .from('conversation-files')
              .getPublicUrl(data.path);
            
            return { name: pf.file.name, url: urlData.publicUrl, type: pf.file.type, size: pf.file.size };
          })
        );
      } catch (uploadError) {
        console.error('[Widget] Error uploading files to storage:', uploadError);
        console.error('[Widget] Upload error details:', {
          bucket: 'conversation-files',
          conversationId: activeConversationId,
          fileCount: pendingFiles.length,
          fileNames: pendingFiles.map(pf => pf.file.name),
        });
        // Fall back to blob URLs if upload fails (will show broken on app side)
        uploadedFiles = pendingFiles.map(pf => ({ name: pf.file.name, url: pf.preview, type: pf.file.type, size: pf.file.size }));
      }
    }
    
    // Create optimistic message with temp ID for tracking
    const tempId = `temp-${Date.now()}`;
    const userMsgId = `user-${Date.now()}`;
    const newMessage: Message = {
      id: userMsgId,
      tempId,
      role: 'user',
      content: userContent,
      read: false,
      timestamp: new Date(),
      type: pendingFiles.length > 0 ? 'file' : 'text',
      files: uploadedFiles,
      reactions: [],
    };
    
    // Mark this message ID for animation
    setNewMessageIds(prev => new Set([...prev, userMsgId]));
    setTimeout(() => setNewMessageIds(prev => { const n = new Set(prev); n.delete(userMsgId); return n; }), 300);
    
    setMessages(prev => [...prev, newMessage]);
    setPendingFiles([]);
    setMessageInput('');
    setIsTyping(true);

    try {
      // PHASE 5: Send only the new user message - edge function fetches history from DB
      const newUserMessage = {
        role: newMessage.role,
        content: newMessage.content,
        files: newMessage.files,
      };

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
        newUserMessage,
        chatUser?.leadId,
        finalPageVisits.length > 0 ? finalPageVisits : undefined,
        referrerJourney || undefined,
        visitorId
      );

      if (response.conversationId && response.conversationId !== activeConversationId) {
        // CRITICAL: Mark as fetched BEFORE setting activeConversationId
        // This prevents the useEffect from triggering a DB fetch that overwrites local messages
        markConversationFetched(response.conversationId);
        
        setActiveConversationId(response.conversationId);
        
        if (chatUser) {
          const updatedUser = { ...chatUser, conversationId: response.conversationId };
          setChatUser(updatedUser);
          localStorage.setItem(`chatpad_user_${config.agentId}`, JSON.stringify(updatedUser));
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
        // Update user message with ID
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
        
        // Check for chunked messages (new multi-message format)
        if (response.messages && response.messages.length > 0) {
          // Pre-register all chunk IDs to prevent realtime duplicates
          response.messages.forEach(chunk => {
            if (chunk.id) recentChunkIdsRef.current.add(chunk.id);
          });
          
          // Display chunks with staggered delays for natural feel
          for (let i = 0; i < response.messages.length; i++) {
            const chunk = response.messages[i];
            const isLastChunk = i === response.messages.length - 1;
            
            // Add random delay between 750-1000ms (except for first chunk)
            if (i > 0) {
              const delay = 750 + Math.random() * 250; // 750-1000ms
              setIsTyping(true); // Show typing indicator between chunks
              await new Promise(resolve => setTimeout(resolve, delay));
            }
            
            setIsTyping(false);
            
            // Mark chunk for animation
            if (chunk.id) {
              setNewMessageIds(prev => new Set([...prev, chunk.id]));
              setTimeout(() => setNewMessageIds(prev => { const n = new Set(prev); n.delete(chunk.id); return n; }), 300);
            }
            
            setMessages(prev => [...prev, { 
              id: chunk.id,
              role: 'assistant', 
              content: chunk.content, 
              read: isOpen && currentView === 'messages', 
              timestamp: new Date(), 
              type: 'text', 
              reactions: [],
              // Only attach link previews, quick replies, call actions, and booking components to the last chunk
              linkPreviews: isLastChunk ? response.linkPreviews : undefined,
              quickReplies: isLastChunk ? response.quickReplies : undefined,
              callActions: isLastChunk ? response.callActions : undefined,
              dayPicker: isLastChunk ? response.dayPicker : undefined,
              timePicker: isLastChunk ? response.timePicker : undefined,
              bookingConfirmed: isLastChunk ? response.bookingConfirmed : undefined,
            }]);
          }
          
          // Clear chunk IDs after delay to allow realtime cleanup
          setTimeout(() => {
            response.messages?.forEach(chunk => {
              if (chunk.id) recentChunkIdsRef.current.delete(chunk.id);
            });
          }, 5000);
          
          // Check if AI marked conversation complete - show rating after delay
          if (response.aiMarkedComplete && !hasShownRatingRef.current) {
            setTimeout(() => {
              setRatingTriggerType('ai_marked_complete');
              setShowRatingPrompt(true);
              hasShownRatingRef.current = true;
            }, 3000); // 3 second delay after last chunk
          }
        } else {
          // Legacy single message fallback - mark for animation
          const msgId = response.assistantMessageId || `legacy-${Date.now()}`;
          setNewMessageIds(prev => new Set([...prev, msgId]));
          setTimeout(() => setNewMessageIds(prev => { const n = new Set(prev); n.delete(msgId); return n; }), 300);
          
          setMessages(prev => [...prev, { 
            id: msgId,
            role: 'assistant', 
            content: response.response, 
            read: isOpen && currentView === 'messages', 
            timestamp: new Date(), 
            type: 'text', 
            reactions: [],
            linkPreviews: response.linkPreviews,
            quickReplies: response.quickReplies,
            callActions: response.callActions,
            dayPicker: response.dayPicker,
            timePicker: response.timePicker,
            bookingConfirmed: response.bookingConfirmed,
          }]);
          
          // Check if AI marked conversation complete - show rating after delay
          if (response.aiMarkedComplete && !hasShownRatingRef.current) {
            setTimeout(() => {
              setRatingTriggerType('ai_marked_complete');
              setShowRatingPrompt(true);
              hasShownRatingRef.current = true;
            }, 3000);
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Mark the optimistic user message as failed
      setMessages(prev => prev.map(msg => 
        msg.tempId === tempId 
          ? { ...msg, failed: true }
          : msg
      ));
    } finally {
      setIsTyping(false);
      // Defer ref reset to next tick to ensure React effects have completed
      setTimeout(() => {
        isActivelySendingRef.current = false;
      }, 0);
    }
  };

  // Update ref after handleSendMessage is defined
  handleSendMessageRef.current = handleSendMessage;
  
  // Handle quick reply selection - set input and trigger auto-send
  const handleQuickReplySelectWithSend = (suggestion: string) => {
    // Clear quick replies from current message
    setMessages(prev => prev.map((msg, idx) => 
      idx === prev.length - 1 && msg.quickReplies 
        ? { ...msg, quickReplies: undefined }
        : msg
    ));
    // Mark as pending and set input
    quickReplyPendingRef.current = suggestion;
    setMessageInput(suggestion);
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

  const handleFormSubmit = async (userData: ChatUser, conversationId?: string) => {
    localStorage.setItem(`chatpad_user_${config.agentId}`, JSON.stringify(userData));
    setChatUser(userData);
    
    // Clear messages and set up for AI greeting
    setMessages([]);
    
    // CRITICAL: Mark conversation as fetched BEFORE setting activeConversationId
    // This prevents the useEffect from triggering a DB fetch that overwrites messages
    if (conversationId) {
      markConversationFetched(conversationId);
    }
    
    setActiveConversationId(conversationId || 'new');
    
    // Trigger AI to generate personalized greeting using lead data
    setIsTyping(true);
    try {
      const response = await sendChatMessage(
        config.agentId,
        conversationId || 'new',
        { role: 'user', content: '__GREETING_REQUEST__' },
        userData.leadId,
        pageVisits.length > 0 ? pageVisits : undefined,
        referrerJourney || undefined,
        visitorId
      );
      
      if (response.conversationId && response.conversationId !== conversationId) {
        markConversationFetched(response.conversationId);
        setActiveConversationId(response.conversationId);
        
        const updatedUser = { ...userData, conversationId: response.conversationId };
        setChatUser(updatedUser);
        localStorage.setItem(`chatpad_user_${config.agentId}`, JSON.stringify(updatedUser));
      }
      
      if (response.response) {
        setMessages([{ 
          id: response.assistantMessageId,
          role: 'assistant', 
          content: response.response, 
          read: true, 
          timestamp: new Date(), 
          type: 'text', 
          reactions: [],
          linkPreviews: response.linkPreviews,
        }]);
      }
    } catch (error) {
      console.error('Error getting AI greeting:', error);
      // Fallback to a simple greeting if AI fails
      setMessages([{ 
        role: 'assistant', 
        content: `Welcome! How can I help you today?`, 
        read: true, 
        timestamp: new Date(), 
        type: 'text', 
        reactions: [] 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Loading state
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

  // Widget content
  const widgetContent = (
    <div id="chatpad-widget-root" className="h-full bg-transparent flex flex-col items-end gap-4 justify-end">
      {(isOpen || isIframeMode) && (
        <Card
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
                      onDismiss={() => setShowRatingPrompt(false)}
                    />
                  )}
                </div>
              )}

              {currentView === 'help' && (
                <HelpView
                  config={config}
                  helpCategories={config.helpCategories}
                  helpArticles={config.helpArticles}
                />
              )}

              {currentView === 'news' && (
                <NewsView
                  config={config}
                  newsItems={config.newsItems || []}
                />
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
        </Card>
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
    return <TooltipProvider>{widgetContent}</TooltipProvider>;
  }

  // For contained preview mode (embed tab preview), render with absolute positioning
  if (containedPreview) {
    return (
      <TooltipProvider>
        <div className={`absolute ${positionClasses[position] || positionClasses['bottom-right']}`}>
          {widgetContent}
        </div>
      </TooltipProvider>
    );
  }

  // Default mode: fixed positioning for standalone widget
  return (
    <TooltipProvider>
      <div className={`fixed z-[9999] ${positionClasses[position] || positionClasses['bottom-right']}`}>
        {widgetContent}
      </div>
    </TooltipProvider>
  );
};
