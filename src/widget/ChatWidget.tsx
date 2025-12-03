import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { fetchWidgetConfig, createLead, submitArticleFeedback, sendChatMessage, subscribeToMessages, unsubscribeFromMessages, subscribeToConversationStatus, unsubscribeFromConversationStatus, subscribeToTypingIndicator, unsubscribeFromTypingIndicator, fetchTakeoverAgent, type WidgetConfig, type ChatResponse } from './api';
import type { RealtimeChannel } from '@supabase/supabase-js';
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
import { Skeleton } from '@/components/ui/skeleton';
import { X, Send01, MessageChatCircle, ChevronRight, Zap, BookOpen01, Microphone01, Attachment01, Image03, FileCheck02, ThumbsUp, ThumbsDown } from '@untitledui/icons';
import { CategoryIcon } from './category-icons';
import { HomeNavIcon, ChatNavIcon, HelpNavIcon } from './NavIcons';
import { ChatBubbleIcon } from '@/components/agents/ChatBubbleIcon';
import ChatPadLogo from '@/components/ChatPadLogo';
import { generateGradientPalette, hexToRgb } from '@/lib/color-utils';
import DOMPurify from 'isomorphic-dompurify';

// Shared CSS variables to ensure consistent light mode styling across render modes
const WIDGET_CSS_VARS = {
  colorScheme: 'light',
  '--background': '0 0% 100%',
  '--foreground': '0 0% 3.9%',
  '--card': '0 0% 100%',
  '--card-foreground': '0 0% 3.9%',
  '--popover': '0 0% 100%',
  '--popover-foreground': '0 0% 3.9%',
  '--primary': '221.2 83.2% 53.3%',
  '--primary-foreground': '0 0% 98%',
  '--secondary': '0 0% 96.1%',
  '--secondary-foreground': '0 0% 9%',
  '--muted': '0 0% 96.1%',
  '--muted-foreground': '0 0% 45.1%',
  '--accent': '0 0% 96.1%',
  '--accent-foreground': '0 0% 9%',
  '--destructive': '0 84.2% 60.2%',
  '--destructive-foreground': '0 0% 98%',
  '--border': '0 0% 89.8%',
  '--input': '0 0% 89.8%',
  '--ring': '221.2 83.2% 53.3%',
  '--radius': '0.5rem',
} as React.CSSProperties;

// Eager load CSSBubbleBackground (CSS-only, ~3KB) to prevent flicker on widget open
import { CSSBubbleBackground } from '@/components/ui/css-bubble-background';
// Lazy load heavy components to reduce initial bundle size
const VoiceInput = lazy(() => import('@/components/molecule-ui/voice-input').then(m => ({ default: m.VoiceInput })));
const FileDropZone = lazy(() => import('@/components/chat/FileDropZone').then(m => ({ default: m.FileDropZone })));

const MessageReactions = lazy(() => import('@/components/chat/MessageReactions').then(m => ({ default: m.MessageReactions })));
const AudioPlayer = lazy(() => import('@/components/chat/AudioPlayer').then(m => ({ default: m.AudioPlayer })));
const PhoneInputField = lazy(() => import('@/components/ui/phone-input').then(m => ({ default: m.PhoneInputField })));

interface ChatWidgetProps {
  config: WidgetConfig | { agentId: string; position?: string; primaryColor?: string };
  previewMode?: boolean;
  containedPreview?: boolean;
  isLoading?: boolean; // When true, show skeleton placeholders for dynamic content
}

type ViewType = 'home' | 'messages' | 'help';

interface ChatUser {
  firstName: string;
  lastName: string;
  email: string;
  leadId: string;
  conversationId?: string; // Database conversation ID
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  read?: boolean;
  timestamp: Date;
  type?: 'text' | 'audio' | 'file';
  audioUrl?: string;
  files?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  reactions?: Array<{ emoji: string; count: number; userReacted: boolean }>;
  isSystemNotice?: boolean; // For takeover notices - no timestamp, no emoji, no avatar
  isHuman?: boolean;
  senderName?: string;
  senderAvatar?: string;
}

interface Conversation {
  id: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  preview: string;
}

// Detect mobile full-screen mode (matches media query in chatpad-widget.js)
const getIsMobileFullScreen = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 480;
};

export const ChatWidget = ({ config: configProp, previewMode = false, containedPreview = false, isLoading: isLoadingProp = false }: ChatWidgetProps) => {
  // Mobile detection for removing border radius on full-screen mobile
  const [isMobileFullScreen, setIsMobileFullScreen] = useState(getIsMobileFullScreen);
  
  useEffect(() => {
    const handleResize = () => setIsMobileFullScreen(getIsMobileFullScreen());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // If isLoading prop is provided, parent is handling config fetching (Intercom-style)
  const parentHandlesConfig = isLoadingProp !== undefined && 'greeting' in configProp;
  const isSimpleConfig = !parentHandlesConfig && 'agentId' in configProp && !('greeting' in configProp);
  
  const [config, setConfig] = useState<WidgetConfig | null>(
    isSimpleConfig ? null : (configProp as WidgetConfig)
  );
  const [loading, setLoading] = useState(isSimpleConfig);
  
  // Use the loading state from parent if provided (Intercom-style instant loading)
  const isContentLoading = parentHandlesConfig ? isLoadingProp : loading;
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  
  const agentId = isSimpleConfig ? (configProp as any).agentId : (configProp as WidgetConfig).agentId;
  
  const [chatUser, setChatUser] = useState<ChatUser | null>(() => {
    const stored = localStorage.getItem(`chatpad_user_${agentId}`);
    return stored ? JSON.parse(stored) : null;
  });
  
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
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
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showConversationList, setShowConversationList] = useState(false);
  const [isHumanTakeover, setIsHumanTakeover] = useState(false);
  const [isHumanTyping, setIsHumanTyping] = useState(false);
  const [typingAgentName, setTypingAgentName] = useState<string | undefined>();
  const [takeoverAgentName, setTakeoverAgentName] = useState<string | undefined>();
  const [takeoverAgentAvatar, setTakeoverAgentAvatar] = useState<string | undefined>();
  const [unreadCount, setUnreadCount] = useState(0);
  const [headerScrollY, setHeaderScrollY] = useState(0);
  const homeContentRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isOpeningConversationRef = useRef(false);

  // Track hover state for nav icons
  const [hoveredNav, setHoveredNav] = useState<'home' | 'messages' | 'help' | null>(null);

  // Load config on mount if simple config
  useEffect(() => {
    if (isSimpleConfig) {
      fetchWidgetConfig((configProp as any).agentId)
        .then(cfg => {
          setConfig(cfg);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load config:', err);
          setLoading(false);
        });
    }
  }, []);

  // Sync config state when configProp changes (for preview mode OR parent handles config)
  useEffect(() => {
    if (!isSimpleConfig && (previewMode || parentHandlesConfig)) {
      setConfig(configProp as WidgetConfig);
    }
  }, [configProp, isSimpleConfig, previewMode, parentHandlesConfig]);

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


  // Signal to parent that widget is ready to display (eliminates flicker on first open)
  useEffect(() => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'chatpad-widget-ready' }, '*');
    }
  }, []);

  // Initialize activeConversationId from chatUser if available (for returning users)
  // This enables real-time subscriptions immediately on widget load
  useEffect(() => {
    if (chatUser?.conversationId && !activeConversationId) {
      console.log('[Widget] Restoring conversation ID from chatUser:', chatUser.conversationId);
      setActiveConversationId(chatUser.conversationId);
    }
  }, [chatUser?.conversationId]);

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
    if (currentView === 'messages' && activeConversationId && messagesEndRef.current) {
      // Use instant scroll when opening existing conversation, smooth for new messages
      const behavior = isOpeningConversationRef.current ? 'instant' : 'smooth';
      messagesEndRef.current.scrollIntoView({ behavior });
      isOpeningConversationRef.current = false;
    }
  }, [messages, currentView, activeConversationId]);

  // Scroll to bottom when file attachment opens
  useEffect(() => {
    if (isAttachingFiles && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isAttachingFiles]);


  // Mark messages as read
  useEffect(() => {
    if (currentView === 'messages' && activeConversationId) {
      const timer = setTimeout(() => {
        setMessages(prev => prev.map(msg => ({ ...msg, read: true })));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentView, activeConversationId]);

  // Subscribe to real-time messages for human takeover
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);
  const statusChannelRef = useRef<RealtimeChannel | null>(null);
  
  useEffect(() => {
    // Only subscribe if we have a valid database conversation ID (UUID format)
    const isValidUUID = activeConversationId && 
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(activeConversationId);
    
    if (!isValidUUID) {
      return;
    }

    console.log('[Widget] Setting up real-time subscription for:', activeConversationId);
    
    // Unsubscribe from previous channel if exists
    if (realtimeChannelRef.current) {
      unsubscribeFromMessages(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }

    // Subscribe to new messages
    realtimeChannelRef.current = subscribeToMessages(activeConversationId, (newMessage) => {
      // Check if this is a human message (not from AI)
      const isHumanMessage = newMessage.metadata?.sender_type === 'human';
      
      console.log('[Widget] Processing new message:', { 
        id: newMessage.id, 
        isHuman: isHumanMessage,
        content: newMessage.content.substring(0, 50)
      });
      
      // Only add human messages to avoid duplicates (AI messages are added locally)
      if (isHumanMessage) {
        const senderName = newMessage.metadata?.sender_name;
        const senderAvatar = newMessage.metadata?.sender_avatar;
        
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          if (prev.some(m => (m as any).dbId === newMessage.id)) {
            return prev;
          }
          
          return [...prev, {
            role: 'assistant' as const,
            content: newMessage.content,
            read: isOpen && currentView === 'messages',
            timestamp: new Date(newMessage.created_at),
            type: 'text' as const,
            reactions: [],
            dbId: newMessage.id,
            isHuman: true,
            senderName,
            senderAvatar,
          } as Message & { dbId?: string; isHuman?: boolean; senderName?: string; senderAvatar?: string }];
        });

        // Update takeover agent info for the banner
        if (senderName) {
          setTakeoverAgentName(senderName);
          setTakeoverAgentAvatar(senderAvatar);
        }

        // Also stop typing indicator if it was showing
        setIsTyping(false);
      }
    });

    return () => {
      if (realtimeChannelRef.current) {
        unsubscribeFromMessages(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [activeConversationId, isOpen, currentView]);

  // Subscribe to conversation status changes (for human takeover banner)
  useEffect(() => {
    const isValidUUID = activeConversationId && 
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(activeConversationId);
    
    if (!isValidUUID) {
      setIsHumanTakeover(false);
      return;
    }

    console.log('[Widget] Setting up status subscription for:', activeConversationId);
    
    if (statusChannelRef.current) {
      unsubscribeFromConversationStatus(statusChannelRef.current);
      statusChannelRef.current = null;
    }

    statusChannelRef.current = subscribeToConversationStatus(activeConversationId, async (status) => {
      console.log('[Widget] Status changed to:', status);
      const wasTakeover = isHumanTakeover;
      setIsHumanTakeover(status === 'human_takeover');
      
      // When takeover starts, immediately show a system notice
      if (status === 'human_takeover' && !wasTakeover) {
        // Fetch agent info for personalized message
        const agent = await fetchTakeoverAgent(activeConversationId);
        const agentName = agent?.name || 'A team member';
        setTakeoverAgentName(agent?.name);
        setTakeoverAgentAvatar(agent?.avatar);
        
        // Add system notice (no emoji, no timestamp)
        setMessages(prev => {
          // Check if we already have a recent system notice to avoid duplicates
          const lastMsg = prev[prev.length - 1];
          if (lastMsg?.isSystemNotice) return prev;
          
          return [...prev, {
            role: 'assistant',
            content: `${agentName} has joined the conversation`,
            read: true,
            timestamp: new Date(),
            type: 'text',
            reactions: [],
            isSystemNotice: true,
          }];
        });
      }
    });

    return () => {
      if (statusChannelRef.current) {
        unsubscribeFromConversationStatus(statusChannelRef.current);
        statusChannelRef.current = null;
      }
    };
  }, [activeConversationId]);

  // Subscribe to human typing indicators when in takeover mode
  const typingChannelRef = useRef<RealtimeChannel | null>(null);
  
  useEffect(() => {
    const isValidUUID = activeConversationId && 
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(activeConversationId);
    
    // Only subscribe to typing if in human takeover mode
    if (!isValidUUID || !isHumanTakeover) {
      setIsHumanTyping(false);
      setTypingAgentName(undefined);
      return;
    }

    console.log('[Widget] Setting up typing indicator subscription for:', activeConversationId);
    
    if (typingChannelRef.current) {
      unsubscribeFromTypingIndicator(typingChannelRef.current);
      typingChannelRef.current = null;
    }

    typingChannelRef.current = subscribeToTypingIndicator(
      activeConversationId,
      (isTyping, agentName) => {
        console.log('[Widget] Typing indicator changed:', { isTyping, agentName });
        setIsHumanTyping(isTyping);
        setTypingAgentName(agentName);
      }
    );

    return () => {
      if (typingChannelRef.current) {
        unsubscribeFromTypingIndicator(typingChannelRef.current);
        typingChannelRef.current = null;
      }
    };
  }, [activeConversationId, isHumanTakeover]);

  // Track unread count and notify parent
  useEffect(() => {
    const unread = messages.filter(m => m.role === 'assistant' && !m.read).length;
    setUnreadCount(unread);
    
    // Notify parent window of unread count for badge display
    if (window.parent !== window) {
      window.parent.postMessage({ 
        type: 'chatpad-unread-count', 
        count: unread 
      }, '*');
    }
  }, [messages]);


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

      // Initial resize
      handleResize();

      // Observe content changes for resize
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

  // Listen for messages from parent window (iframe mode)
  useEffect(() => {
    if (previewMode) return;

    const handleParentMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;

      switch (event.data.type) {
        case 'chatpad-widget-opened':
          setIsOpen(true);
          break;
        case 'chatpad-widget-closed':
          setIsOpen(false);
          break;
      }
    };

    window.addEventListener('message', handleParentMessage);
    return () => window.removeEventListener('message', handleParentMessage);
  }, [previewMode]);

  // Only return null for simple config loading, not when parent handles config (instant loading)
  if (!parentHandlesConfig && (loading || !config)) return null;

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

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
        // Returning user - if they have a conversation ID, activate it for real-time subscription
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
      isOpeningConversationRef.current = true; // Use instant scroll for existing conversations
      setActiveConversationId(conversationId);
      setMessages(conversation.messages);
      setShowConversationList(false);
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    else if (diffHours < 24) return `${diffHours}h ago`;
    else if (diffDays < 7) return `${diffDays}d ago`;
    else return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() && pendingFiles.length === 0) return;

    const userContent = pendingFiles.length > 0 ? (messageInput || 'Sent files') : messageInput;
    
    // Create user message
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
      // Build message history for context
      const messageHistory = [...messages, newMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      // Call the real AI endpoint
      const response = await sendChatMessage(
        config.agentId,
        activeConversationId,
        messageHistory,
        chatUser?.leadId
      );

      // Update conversation ID if this was a new conversation
      if (response.conversationId && response.conversationId !== activeConversationId) {
        const oldConvId = activeConversationId;
        setActiveConversationId(response.conversationId);
        
        // Update chatUser with new conversation ID
        if (chatUser) {
          const updatedUser = { ...chatUser, conversationId: response.conversationId };
          setChatUser(updatedUser);
          localStorage.setItem(`chatpad_user_${config.agentId}`, JSON.stringify(updatedUser));
        }
        
        // Update local conversations array to use the database UUID
        if (oldConvId) {
          setConversations(prev => prev.map(conv => 
            conv.id === oldConvId 
              ? { ...conv, id: response.conversationId } 
              : conv
          ));
        }
      }

      // Handle human takeover status
      if (response.status === 'human_takeover') {
        setIsHumanTakeover(true);
        if (response.takenOverBy) {
          setTakeoverAgentName(response.takenOverBy.name);
          setTakeoverAgentAvatar(response.takenOverBy.avatar);
        }
        // Note: System notice is now added via real-time status subscription, not here
        // This prevents duplicate notices
      } else if (response.response) {
        // Add AI response
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: response.response, 
          read: isOpen && currentView === 'messages', 
          timestamp: new Date(), 
          type: 'text', 
          reactions: [] 
        }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error message to user
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
      // Remove the onstop handler to prevent message being sent
      mediaRecorderRef.current.onstop = null;
      // Stop the recorder
      mediaRecorderRef.current.stop();
      // Stop all audio tracks (turn off microphone)
      mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
    }
    // Reset state
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

  const getSessionId = () => {
    let sessionId = localStorage.getItem('chatpad_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('chatpad_session_id', sessionId);
    }
    return sessionId;
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
      window.parent.postMessage({ type: 'chatpad-widget-close' }, '*');
    }
  };

  // Loading skeleton
  if (loading || !config) {
    return (
      <div className="w-full h-full flex flex-col bg-background p-4">
        {/* Header skeleton */}
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        {/* Content skeletons */}
        <div className="space-y-4 flex-1">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
        {/* Nav skeleton */}
        <div className="flex justify-around pt-4 border-t mt-auto">
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-16" />
        </div>
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
                    className="px-6 pb-4 transition-opacity duration-200"
                    style={{ opacity: Math.max(0, 1 - headerScrollY / 100) }}
                  >
                    <h2 className="text-3xl font-bold text-white drop-shadow-sm">
                      {config.welcomeTitle} {config.welcomeEmoji}
                    </h2>
                    <p className="text-white/90 text-base drop-shadow-sm">{config.welcomeSubtitle}</p>
                  </div>
                  
                  {/* Content wrapper with gradient from transparent to white */}
                  <div 
                    className="relative z-20 flex-1 flex flex-col justify-start"
                    style={{
                      background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.5) 25%, rgba(255,255,255,0.85) 50%, white 75%)'
                    }}
                  >
                    <div className="px-6 py-4 space-y-3">
                      {isContentLoading ? (
                        // Loading skeleton for dynamic content
                        <div className="space-y-3 animate-pulse">
                          <div className="h-20 bg-black/5 rounded-lg" />
                          <div className="h-16 bg-black/5 rounded-lg" />
                          <div className="h-16 bg-black/5 rounded-lg" />
                        </div>
                      ) : (
                        <>
                          {config.announcements.length > 0 && (
                            <CSSAnimatedList className="space-y-3 mb-6" staggerDelay={0.1}>
                              {config.announcements.map((announcement) => (
                                <CSSAnimatedItem key={announcement.id}>
                                  <div
                                    className="rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                                    style={{ backgroundColor: announcement.background_color }}
                                    onClick={() => {
                                      if (announcement.action_type === 'start_chat') setCurrentView('messages');
                                      else if (announcement.action_type === 'open_help') setCurrentView('help');
                                    }}
                                  >
                                  {announcement.image_url && (
                                    <div className="h-32 overflow-hidden">
                                      <img src={announcement.image_url} alt="" className="w-full h-full object-cover" />
                                    </div>
                                  )}
                                   <div className="p-4 flex items-center justify-between">
                                     <div className="flex-1">
                                       <h3 className="font-semibold text-base" style={{ color: announcement.title_color }}>{announcement.title}</h3>
                                       {announcement.subtitle && <p className="text-sm text-muted-foreground mt-1">{announcement.subtitle}</p>}
                                     </div>
                                     <ChevronRight className="h-5 w-5 text-muted-foreground" />
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
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-transparent h-8 w-8" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
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
                              const honeypot = formData.get('website') as string; // Honeypot field
                              const customFieldData: Record<string, any> = {};

                              // Spam check: if honeypot is filled, silently reject
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
                                // Inline validation
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
                                // Add greeting message for new user after form submission
                                setMessages([{ role: 'assistant', content: config.greeting, read: true, timestamp: new Date(), type: 'text', reactions: [] }]);
                                // Use the database conversation ID if available
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
                            <div className="bg-muted/60 rounded-full px-4 py-1.5">
                              <p className="text-xs text-muted-foreground">{msg.content}</p>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} ${msgWithExtras.isHuman ? 'items-start gap-2' : ''}`}>
                          {/* Avatar for human messages */}
                          {msgWithExtras.isHuman && msgWithExtras.senderAvatar && (
                            <img 
                              src={msgWithExtras.senderAvatar} 
                              alt={msgWithExtras.senderName || 'Team'} 
                              className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling;
                                if (fallback) fallback.classList.remove('hidden');
                              }}
                            />
                          )}
                          {/* Fallback avatar - shown when image fails or no avatar */}
                          {msgWithExtras.isHuman && (
                            <div className={`w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5 ${msgWithExtras.senderAvatar ? 'hidden' : ''}`}>
                              <span className="text-blue-600 text-xs font-medium">
                                {(msgWithExtras.senderName || 'T').charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div 
                            className={`max-w-[80%] rounded-lg p-3 ${msg.role === 'user' ? '' : msgWithExtras.isHuman ? 'bg-blue-50 border border-blue-100' : 'bg-muted'}`}
                            style={msg.role === 'user' ? { 
                              backgroundColor: `rgba(${hexToRgb(config.gradientStartColor)}, 0.12)`,
                              color: 'inherit'
                            } : undefined}
                          >
                            {msgWithExtras.isHuman && (
                              <div className="flex items-center gap-1.5 text-xs text-blue-600 mb-1">
                                <span className="font-medium">{msgWithExtras.senderName || 'Team Member'}</span>
                              </div>
                            )}
                            {msg.type === 'audio' && msg.audioUrl && (
                            <Suspense fallback={<div className="h-10 w-full bg-muted animate-pulse rounded" />}>
                              <AudioPlayer audioUrl={msg.audioUrl} primaryColor={config.primaryColor} />
                            </Suspense>
                          )}
                          {msg.type === 'file' && msg.files && (
                            <div className="space-y-2">
                              {msg.files.map((file, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                  {file.type.startsWith('image/') ? <Image03 className="h-4 w-4" /> : <FileCheck02 className="h-4 w-4" />}
                                  <span>{file.name}</span>
                                </div>
                              ))}
                              {msg.content && <p className="text-sm mt-2">{msg.content}</p>}
                            </div>
                          )}
                          {msg.type === 'text' && <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>}
                          
                          {config.enableMessageReactions && (
                            <Suspense fallback={null}>
                              <MessageReactions
                                reactions={msg.reactions || []}
                                onAddReaction={(emoji) => {
                                  const newMessages = [...messages];
                                  const reaction = newMessages[idx].reactions?.find(r => r.emoji === emoji);
                                  if (reaction) {
                                    reaction.count += 1;
                                    reaction.userReacted = true;
                                  } else {
                                    newMessages[idx].reactions = [...(newMessages[idx].reactions || []), { emoji, count: 1, userReacted: true }];
                                  }
                                  setMessages(newMessages);
                                }}
                                onRemoveReaction={(emoji) => {
                                  const newMessages = [...messages];
                                  const reaction = newMessages[idx].reactions?.find(r => r.emoji === emoji);
                                  if (reaction) {
                                    reaction.count -= 1;
                                    reaction.userReacted = false;
                                    if (reaction.count === 0) {
                                      newMessages[idx].reactions = newMessages[idx].reactions?.filter(r => r.emoji !== emoji);
                                    }
                                  }
                                  setMessages(newMessages);
                                }}
                              primaryColor={config.primaryColor}
                                compact
                                isUserMessage={msg.role === 'user'}
                              />
                            </Suspense>
                          )}
                          
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <span className="text-xs opacity-70">{formatTimestamp(msg.timestamp)}</span>
                            {msg.role === 'user' && config.showReadReceipts && msg.read && <span className="text-xs opacity-70">Read</span>}
                          </div>
                        </div>
                      </div>
                      );
                    })}

                    {(isTyping || isHumanTyping) && (
                      <div className="flex justify-start items-start gap-2">
                        {isHumanTyping && takeoverAgentAvatar && (
                          <img 
                            src={takeoverAgentAvatar} 
                            alt={takeoverAgentName || 'Team'} 
                            className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                          />
                        )}
                        {isHumanTyping && !takeoverAgentAvatar && (
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 text-xs font-medium">
                              {(takeoverAgentName || 'T').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className={`rounded-lg p-3 flex items-center gap-2 ${
                          isHumanTyping ? 'bg-blue-50 border border-blue-100' : 'bg-muted'
                        }`}>
                          <div className="flex gap-1">
                            <div className={`w-2 h-2 rounded-full animate-bounce ${
                              isHumanTyping ? 'bg-blue-400' : 'bg-foreground/40'
                            }`} style={{ animationDelay: '0ms' }} />
                            <div className={`w-2 h-2 rounded-full animate-bounce ${
                              isHumanTyping ? 'bg-blue-400' : 'bg-foreground/40'
                            }`} style={{ animationDelay: '150ms' }} />
                            <div className={`w-2 h-2 rounded-full animate-bounce ${
                              isHumanTyping ? 'bg-blue-400' : 'bg-foreground/40'
                            }`} style={{ animationDelay: '300ms' }} />
                          </div>
                          {isHumanTyping && takeoverAgentName && (
                            <span className="text-xs text-blue-600 ml-1">{takeoverAgentName} is typing...</span>
                          )}
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
                              className="mb-3"
                            >
                              <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
                              Back
                            </Button>
                            
                            <h2 className="text-xl font-bold mb-4">{selectedArticle.title}</h2>
                            <div 
                              className="article-content max-w-none" 
                              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedArticle.content, {
                                ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'span', 'div', 'img'],
                                ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'src', 'alt', 'width', 'height', 'style'],
                              }) }} 
                            />
                          </div>
                        )}
                      </div>

                      {/* Feedback Section - Pinned to Bottom */}
                      <div className="p-4 border-t bg-muted/30">
                        <p className="text-sm font-medium mb-3">Was this article helpful?</p>
                        {!feedbackSubmitted ? (
                          <div className="space-y-3">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={articleFeedback === 'helpful' ? 'default' : 'outline'}
                                onClick={() => { 
                                  setArticleFeedback('helpful'); 
                                  setShowFeedbackComment(true); 
                                }}
                                className="flex-1"
                                style={articleFeedback === 'helpful' ? { backgroundColor: config.primaryColor } : {}}
                              >
                                <ThumbsUp className="h-4 w-4 mr-2" />
                                Yes
                              </Button>
                              <Button
                                size="sm"
                                variant={articleFeedback === 'not_helpful' ? 'default' : 'outline'}
                                onClick={() => { 
                                  setArticleFeedback('not_helpful'); 
                                  setShowFeedbackComment(true); 
                                }}
                                className="flex-1"
                              >
                                <ThumbsDown className="h-4 w-4 mr-2" />
                                No
                              </Button>
                            </div>

                            {showFeedbackComment && (
                              <div className="space-y-2">
                                <Textarea
                                  value={feedbackComment}
                                  onChange={(e) => setFeedbackComment(e.target.value)}
                                  placeholder="Tell us more (optional)"
                                  className="text-sm min-h-[80px]"
                                />
                                <Button 
                                  size="sm" 
                                  onClick={handleSubmitFeedback} 
                                  style={{ backgroundColor: config.primaryColor }} 
                                  className="w-full"
                                >
                                  Submit Feedback
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-2">
                            <p className="text-sm text-muted-foreground mb-2">Thank you for your feedback!</p>
                          </div>
                        )}
                      </div>
                    </div>
                   )}
                 </div>
               )}
             </div>
             )}

            {/* Bottom Navigation */}
            {config.showBottomNav && (
              <div className="border-t bg-background flex justify-around">
                <button 
                  onMouseEnter={() => setHoveredNav('home')}
                  onMouseLeave={() => setHoveredNav(null)}
                  onClick={() => {
                    setCurrentView('home');
                    setSelectedCategory(null);
                    setSelectedArticle(null);
                    setHelpSearchQuery('');
                  }} 
                  className={`flex-1 flex flex-col items-center justify-center h-auto py-2 transition-colors focus:outline-none focus-visible:ring-0 ${
                    currentView === 'home' 
                      ? 'text-foreground' 
                      : 'text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center justify-center w-6 h-6 mb-1.5">
                    <HomeNavIcon active={currentView === 'home'} hovered={hoveredNav === 'home'} className="h-5 w-5" />
                  </div>
                  <span className="text-xs pl-0.5">Home</span>
                </button>
                {config.enableMessagesTab && (
                  <button 
                    onMouseEnter={() => setHoveredNav('messages')}
                    onMouseLeave={() => setHoveredNav(null)}
                    onClick={() => {
                      setCurrentView('messages');
                      if (chatUser) {
                        // Returning user - show conversation list
                        setShowConversationList(true);
                      } else {
                        // New user - show contact form
                        setActiveConversationId('new');
                        setShowConversationList(false);
                      }
                    }}
                    className={`flex-1 flex flex-col items-center justify-center h-auto py-2 relative transition-colors focus:outline-none focus-visible:ring-0 ${
                      currentView === 'messages' 
                        ? 'text-foreground' 
                        : 'text-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-center w-6 h-6 mb-1.5">
                      <ChatNavIcon active={currentView === 'messages'} hovered={hoveredNav === 'messages'} className="h-5 w-5" />
                    </div>
                    <span className="text-xs pl-0.5">Chat</span>
                    {messages.some(m => !m.read && m.role === 'assistant') && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                  </button>
                )}
                {config.enableHelpTab && config.helpArticles.length > 0 && (
                  <button 
                    onMouseEnter={() => setHoveredNav('help')}
                    onMouseLeave={() => setHoveredNav(null)}
                    onClick={() => setCurrentView('help')} 
                    className={`flex-1 flex flex-col items-center justify-center h-auto py-2 transition-colors focus:outline-none focus-visible:ring-0 ${
                      currentView === 'help' 
                        ? 'text-foreground' 
                        : 'text-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-center w-6 h-6 mb-1.5">
                      <HelpNavIcon active={currentView === 'help'} hovered={hoveredNav === 'help'} className="h-5 w-5" />
                    </div>
                    <span className="text-xs pl-0.5">Help</span>
                  </button>
                )}
              </div>
            )}
          </Card>
        ) : (
          <div className="relative">
            {/* Widget Button */}
            <Button
              size="icon"
              className="h-11 w-11 rounded-full shadow-lg hover:scale-110 transition-transform relative"
              style={{ backgroundColor: config.primaryColor }}
              onClick={() => setIsOpen(true)}
            >
              {/* Chat Icon */}
              <ChatBubbleIcon className="h-6 w-6 relative z-10" />
            </Button>
          </div>
        )}
      </div>
  );

  // In iframe mode, render directly without fixed positioning
  if (isIframeMode) {
    return (
      <div className="w-full h-full light" style={WIDGET_CSS_VARS}>
        {widgetContent}
      </div>
    );
  }

  // Contained preview mode: Use absolute positioning within parent canvas
  if (containedPreview) {
    return (
      <div className="absolute inset-0 pointer-events-none light" style={WIDGET_CSS_VARS}>
        <div className={`absolute ${positionClasses[position]} pointer-events-auto`}>
          {widgetContent}
        </div>
      </div>
    );
  }

  // Preview mode: Use fixed positioning with position classes
  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] light" style={WIDGET_CSS_VARS}>
      <div className={`absolute ${positionClasses[position]} pointer-events-auto`}>
        {widgetContent}
      </div>
    </div>
  );
};
