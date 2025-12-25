/**
 * useWidgetMessaging Hook
 * 
 * Handles all message sending logic including:
 * - Text message composition and sending
 * - File upload to Supabase storage
 * - Optimistic UI updates with temp IDs
 * - Chunked response handling with staggered display
 * - Quick reply auto-send functionality
 * - Form submission with AI greeting generation
 * - Error handling and message failure states
 * 
 * @module widget/hooks/useWidgetMessaging
 * 
 * @example
 * ```tsx
 * const {
 *   messageInput,
 *   setMessageInput,
 *   pendingFiles,
 *   setPendingFiles,
 *   isTyping,
 *   handleSendMessage,
 *   handleQuickReplySelectWithSend,
 *   handleFormSubmit,
 * } = useWidgetMessaging({
 *   config,
 *   chatUser,
 *   activeConversationId,
 *   // ... other props
 * });
 * ```
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { sendChatMessage, widgetSupabase, type WidgetConfig, type ReferrerJourney } from '../api';
import { widgetLogger } from '../utils/widget-logger';
import type { Message, ChatUser, PendingFile, PageVisit, ViewType } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface UseWidgetMessagingProps {
  /** Widget configuration */
  config: WidgetConfig;
  /** Current chat user (from contact form) */
  chatUser: ChatUser | null;
  /** Set chat user callback */
  setChatUser: (user: ChatUser | null) => void;
  /** Active conversation ID */
  activeConversationId: string | null;
  /** Set active conversation ID callback */
  setActiveConversationId: (id: string | null) => void;
  /** Page visit history for analytics */
  pageVisits: PageVisit[];
  /** Set page visits callback */
  setPageVisits: React.Dispatch<React.SetStateAction<PageVisit[]>>;
  /** Referrer journey data */
  referrerJourney: ReferrerJourney | null;
  /** Unique visitor ID */
  visitorId: string;
  /** Whether widget is open */
  isOpen: boolean;
  /** Current view */
  currentView: ViewType;
  /** Set messages callback */
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  /** Mark conversation as fetched to prevent DB overwrites */
  markConversationFetched: (id: string) => void;
  /** Ref tracking if actively sending */
  isActivelySendingRef: React.MutableRefObject<boolean>;
  /** Ref for current page info */
  currentPageRef: React.MutableRefObject<{ url: string; entered_at: string }>;
  /** Browser language ref */
  browserLanguageRef: React.MutableRefObject<string>;
}

export interface UseWidgetMessagingReturn {
  // === Input State ===
  /** Current message input value */
  messageInput: string;
  /** Set message input */
  setMessageInput: (value: string) => void;
  /** Pending file attachments */
  pendingFiles: PendingFile[];
  /** Set pending files */
  setPendingFiles: React.Dispatch<React.SetStateAction<PendingFile[]>>;
  
  // === UI State ===
  /** Whether AI is typing a response */
  isTyping: boolean;
  /** Set typing state (exposed for external control) */
  setIsTyping: (value: boolean) => void;
  /** Message IDs that should animate (for slide-in) */
  newMessageIds: Set<string>;
  
  // === Refs ===
  /** Ref tracking recent chunk IDs to prevent duplicates */
  recentChunkIdsRef: React.MutableRefObject<Set<string>>;
  
  // === Handlers ===
  /** Send a message (optionally with override text) */
  handleSendMessage: (overrideMessage?: string) => Promise<void>;
  /** Select quick reply and auto-send */
  handleQuickReplySelectWithSend: (suggestion: string) => void;
  /** Handle contact form submission with AI greeting */
  handleFormSubmit: (userData: ChatUser, conversationId?: string) => Promise<void>;
  
  // === Rating State ===
  /** Whether to show rating prompt */
  showRatingPrompt: boolean;
  /** Set rating prompt visibility */
  setShowRatingPrompt: (value: boolean) => void;
  /** Rating trigger type */
  ratingTriggerType: 'team_closed' | 'ai_marked_complete';
  /** Set rating trigger type */
  setRatingTriggerType: (type: 'team_closed' | 'ai_marked_complete') => void;
  /** Ref tracking if rating was shown this session */
  hasShownRatingRef: React.MutableRefObject<boolean>;
  
  // === Takeover State ===
  /** Whether human takeover is active */
  isHumanTakeover: boolean;
  /** Set human takeover state */
  setIsHumanTakeover: (value: boolean) => void;
  /** Takeover agent name */
  takeoverAgentName: string | undefined;
  /** Set takeover agent name */
  setTakeoverAgentName: (name: string | undefined) => void;
  /** Takeover agent avatar URL */
  takeoverAgentAvatar: string | undefined;
  /** Set takeover agent avatar */
  setTakeoverAgentAvatar: (avatar: string | undefined) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useWidgetMessaging({
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
}: UseWidgetMessagingProps): UseWidgetMessagingReturn {
  // === Input State ===
  const [messageInput, setMessageInput] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  
  // === UI State ===
  const [isTyping, setIsTyping] = useState(false);
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());
  
  // === Rating State ===
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  const [ratingTriggerType, setRatingTriggerType] = useState<'team_closed' | 'ai_marked_complete'>('ai_marked_complete');
  const hasShownRatingRef = useRef(false);
  
  // === Takeover State ===
  const [isHumanTakeover, setIsHumanTakeover] = useState(false);
  const [takeoverAgentName, setTakeoverAgentName] = useState<string | undefined>();
  const [takeoverAgentAvatar, setTakeoverAgentAvatar] = useState<string | undefined>();
  
  // === Refs ===
  const recentChunkIdsRef = useRef<Set<string>>(new Set());
  const quickReplyPendingRef = useRef<string | null>(null);
  const handleSendMessageRef = useRef<(() => void) | null>(null);

  // === Main Send Handler ===
  const handleSendMessage = useCallback(async (overrideMessage?: string) => {
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
            const { data, error } = await widgetSupabase.storage
              .from('conversation-files')
              .upload(fileName, pf.file, { upsert: false });
            
            if (error) throw error;
            
            const { data: urlData } = widgetSupabase.storage
              .from('conversation-files')
              .getPublicUrl(data.path);
            
            return { name: pf.file.name, url: urlData.publicUrl, type: pf.file.type, size: pf.file.size };
          })
        );
      } catch (uploadError) {
        widgetLogger.error('[Widget] Error uploading files to storage:', uploadError);
        widgetLogger.error('[Widget] Upload error details:', {
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
      // Send only the new user message - edge function fetches history from DB
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

      widgetLogger.info('[Widget] Sending message with:', {
        pageVisitsCount: finalPageVisits.length,
        referrerJourney: referrerJourney ? 'present' : 'null',
        conversationId: activeConversationId,
        browserLanguage: browserLanguageRef.current,
      });

      const response = await sendChatMessage(
        config.agentId,
        activeConversationId,
        newUserMessage,
        chatUser?.leadId,
        finalPageVisits.length > 0 ? finalPageVisits : undefined,
        referrerJourney || undefined,
        visitorId,
        undefined, // locationId
        undefined, // previewMode
        browserLanguageRef.current // Browser language preference
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
      widgetLogger.error('Error sending message:', error);
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
  }, [
    messageInput,
    pendingFiles,
    config.agentId,
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
  ]);

  // Update ref after handleSendMessage is defined
  handleSendMessageRef.current = handleSendMessage;

  // === Quick Reply Handler ===
  const handleQuickReplySelectWithSend = useCallback((suggestion: string) => {
    // Clear quick replies from current message
    setMessages(prev => prev.map((msg, idx) => 
      idx === prev.length - 1 && msg.quickReplies 
        ? { ...msg, quickReplies: undefined }
        : msg
    ));
    // Mark as pending and set input
    quickReplyPendingRef.current = suggestion;
    setMessageInput(suggestion);
  }, [setMessages]);

  // Effect to auto-send quick reply
  useEffect(() => {
    if (messageInput.trim() && !isActivelySendingRef.current) {
      const shouldAutoSend = quickReplyPendingRef.current === messageInput;
      if (shouldAutoSend) {
        quickReplyPendingRef.current = null;
        handleSendMessageRef.current?.();
      }
    }
  }, [messageInput, isActivelySendingRef]);

  // === Form Submit Handler ===
  const handleFormSubmit = useCallback(async (userData: ChatUser, conversationId?: string) => {
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
      widgetLogger.error('Error getting AI greeting:', error);
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
  }, [
    config.agentId,
    setChatUser,
    setMessages,
    markConversationFetched,
    setActiveConversationId,
    pageVisits,
    referrerJourney,
    visitorId,
  ]);

  return {
    // Input State
    messageInput,
    setMessageInput,
    pendingFiles,
    setPendingFiles,
    
    // UI State
    isTyping,
    setIsTyping,
    newMessageIds,
    
    // Refs
    recentChunkIdsRef,
    
    // Handlers
    handleSendMessage,
    handleQuickReplySelectWithSend,
    handleFormSubmit,
    
    // Rating State
    showRatingPrompt,
    setShowRatingPrompt,
    ratingTriggerType,
    setRatingTriggerType,
    hasShownRatingRef,
    
    // Takeover State
    isHumanTakeover,
    setIsHumanTakeover,
    takeoverAgentName,
    setTakeoverAgentName,
    takeoverAgentAvatar,
    setTakeoverAgentAvatar,
  };
}
