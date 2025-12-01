import { useState, useEffect, useRef } from 'react';
import { fetchWidgetConfig, createLead, submitArticleFeedback, type WidgetConfig } from './api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Send01, Minimize02, MessageChatCircle, ChevronRight, Zap, BookOpen01, Settings01, Microphone01, Attachment01, Image03, FileCheck02, ThumbsUp, ThumbsDown } from '@untitledui/icons';
import { HomeNavIcon, ChatNavIcon, HelpNavIcon } from './NavIcons';
import { ChatBubbleIcon } from '@/components/agents/ChatBubbleIcon';
import ChatPadLogo from '@/components/ChatPadLogo';
import { BubbleBackground } from '@/components/ui/bubble-background';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { VoiceInput } from '@/components/molecule-ui/voice-input';
import { FileDropZone } from '@/components/chat/FileDropZone';
import { MessageReactions } from '@/components/chat/MessageReactions';
import { AudioPlayer } from '@/components/chat/AudioPlayer';
import { toast, Toaster } from 'sonner';
import { z } from 'zod';

interface ChatWidgetProps {
  config: WidgetConfig | { agentId: string; position?: string; primaryColor?: string };
  previewMode?: boolean;
}

type ViewType = 'home' | 'messages' | 'help';

interface ChatUser {
  firstName: string;
  lastName: string;
  email: string;
  leadId: string;
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
}

export const ChatWidget = ({ config: configProp, previewMode = false }: ChatWidgetProps) => {
  const isSimpleConfig = 'agentId' in configProp && !('greeting' in configProp);
  const [config, setConfig] = useState<WidgetConfig | null>(
    isSimpleConfig ? null : (configProp as WidgetConfig)
  );
  const [loading, setLoading] = useState(isSimpleConfig);
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  
  const agentId = isSimpleConfig ? (configProp as any).agentId : (configProp as WidgetConfig).agentId;
  
  const [chatUser, setChatUser] = useState<ChatUser | null>(() => {
    const stored = localStorage.getItem(`chatpad_user_${agentId}`);
    return stored ? JSON.parse(stored) : null;
  });
  
  const [isVisible, setIsVisible] = useState(true);
  const [showTeaser, setShowTeaser] = useState(false);
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
  
  const [helpSearchQuery, setHelpSearchQuery] = useState('');
  const [articleFeedback, setArticleFeedback] = useState<'helpful' | 'not_helpful' | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showFeedbackComment, setShowFeedbackComment] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [headerScrollY, setHeaderScrollY] = useState(0);
  const homeContentRef = useRef<HTMLDivElement>(null);

  const [chatSettings, setChatSettings] = useState(() => {
    const saved = localStorage.getItem(`chatpad_settings_${agentId}`);
    if (saved) return JSON.parse(saved);
    return { soundEnabled: config?.defaultSoundEnabled ?? true, autoScroll: config?.defaultAutoScroll ?? true };
  });

  // Load config on mount if simple config
  useEffect(() => {
    if (isSimpleConfig) {
      fetchWidgetConfig((configProp as any).agentId)
        .then(cfg => {
          setConfig(cfg);
          setMessages([{ role: 'assistant', content: cfg.greeting, read: true, timestamp: new Date(), type: 'text', reactions: [] }]);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load config:', err);
          setLoading(false);
        });
    } else {
      const fullConfig = configProp as WidgetConfig;
      setMessages([{ role: 'assistant', content: fullConfig.greeting, read: true, timestamp: new Date(), type: 'text', reactions: [] }]);
    }
  }, []);

  // Sync config state when configProp changes (for preview mode)
  useEffect(() => {
    if (!isSimpleConfig && previewMode) {
      setConfig(configProp as WidgetConfig);
    }
  }, [configProp, isSimpleConfig, previewMode]);

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

  // Save settings
  useEffect(() => {
    if (config) {
      localStorage.setItem(`chatpad_settings_${agentId}`, JSON.stringify(chatSettings));
    }
  }, [chatSettings, agentId, config]);

  // Load/save messages from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`chatpad_messages_${agentId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const messagesWithDates = parsed.map((msg: any) => ({ ...msg, timestamp: new Date(msg.timestamp) }));
        setMessages(messagesWithDates);
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    }
  }, [agentId]);

  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem(`chatpad_messages_${agentId}`, JSON.stringify(messages));
    }
  }, [messages, agentId]);

  // Auto-scroll
  useEffect(() => {
    if (chatSettings.autoScroll && currentView === 'messages' && activeConversationId) {
      const messagesContainer = document.querySelector('.messages-container');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }
  }, [messages, chatSettings.autoScroll, currentView, activeConversationId]);

  // Update greeting based on user status (only on initial load)
  useEffect(() => {
    if (messages.length === 0 && config) {
      if (chatUser) {
        setMessages([{ role: 'assistant', content: `Welcome back, ${chatUser.firstName}! 👋 How can I help you today?`, read: true, timestamp: new Date(), type: 'text', reactions: [] }]);
      } else {
        setMessages([{ role: 'assistant', content: config.greeting, read: true, timestamp: new Date(), type: 'text', reactions: [] }]);
      }
    }
  }, [chatUser, config]);

  // Mark messages as read
  useEffect(() => {
    if (currentView === 'messages' && activeConversationId) {
      const timer = setTimeout(() => {
        setMessages(prev => prev.map(msg => ({ ...msg, read: true })));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentView, activeConversationId]);

  // Notify parent window of widget state changes
  useEffect(() => {
    // Only send messages if we're in an iframe (not preview mode)
    if (!previewMode && window.parent !== window) {
      window.parent.postMessage({
        type: 'chatpad-widget-state',
        isOpen: isOpen
      }, '*');
    }
  }, [isOpen, previewMode]);

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

  if (loading || !config) return null;

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  const animationClasses = {
    'none': '',
    'pulse': 'animate-pulse',
    'bounce': 'animate-bounce',
    'fade': 'animate-pulse opacity-75',
    'ring': '',
  };

  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}` : '0,0,0';
  };

  // Calculate logo opacity based on scroll (fades out gradually over 80px)
  const logoOpacity = Math.max(0, 1 - headerScrollY / 80);

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
      if (!chatUser) setActiveConversationId('new');
    } else if (actionType === 'open_help' || actionType === 'help') {
      setCurrentView('help');
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

  const handleSendMessage = () => {
    if (!messageInput.trim() && pendingFiles.length === 0) return;

    if (pendingFiles.length > 0) {
      const newMessage: Message = {
        role: 'user',
        content: messageInput || 'Sent files',
        read: false,
        timestamp: new Date(),
        type: 'file',
        files: pendingFiles.map(pf => ({ name: pf.file.name, url: pf.preview, type: pf.file.type, size: pf.file.size })),
        reactions: [],
      };
      setMessages(prev => [...prev, newMessage]);
      setPendingFiles([]);
    } else {
      const newMessage: Message = { role: 'user', content: messageInput, read: false, timestamp: new Date(), type: 'text', reactions: [] };
      setMessages(prev => [...prev, newMessage]);
    }
    
    setMessageInput('');

    if (chatSettings.soundEnabled) {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.1;
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      } catch (error) {
        console.error('Error playing sound:', error);
      }
    }

    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Thanks for your message! This is a demo response.', read: true, timestamp: new Date(), type: 'text', reactions: [] }]);
      setIsTyping(false);
    }, 2000);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setPendingFiles(prev => [...prev, { file, preview: event.target?.result as string }]);
        };
        reader.readAsDataURL(file);
      } else {
        setPendingFiles(prev => [...prev, { file, preview: '' }]);
      }
    });
    e.target.value = '';
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
      toast.success('Thank you for your feedback!');
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      if (error.message?.includes('unique')) {
        toast.error('You have already provided feedback for this article');
      } else {
        toast.error('Failed to submit feedback. Please try again.');
      }
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

  // Shared widget content
  const widgetContent = (
    <div id="chatpad-widget-root">
      {/* Teaser Message */}
      {showTeaser && !isOpen && config.showTeaser && !isIframeMode && (
        <div className="absolute mb-20 mr-2 max-w-xs">
          <div className="bg-card border shadow-lg rounded-lg p-3 animate-in slide-in-from-bottom-2">
            <p className="text-sm">{config.teaserText || config.teaserMessage}</p>
          </div>
        </div>
      )}

      {isOpen || isIframeMode ? (
          <Card className={isIframeMode ? "w-full h-full flex flex-col shadow-none overflow-hidden border-0" : "w-[380px] h-[650px] flex flex-col shadow-xl overflow-hidden border-0"}>
            {/* Header */}
            {currentView === 'home' ? (
              <div className="flex-1 relative overflow-hidden">
                {/* Fixed gradient background - extends full height */}
                <div className="absolute inset-0">
                  <BubbleBackground 
                    interactive
                    colors={{
                      first: hexToRgb(config.gradientStartColor),
                      second: hexToRgb(config.gradientEndColor),
                      third: hexToRgb(config.gradientStartColor),
                      fourth: hexToRgb(config.gradientEndColor),
                      fifth: hexToRgb(config.gradientStartColor),
                      sixth: hexToRgb(config.gradientEndColor),
                    }}
                    className="absolute inset-0"
                  />
                  
                  
                  {/* Logo in top left - aligned with content text */}
                  <ChatPadLogo 
                    className="absolute top-4 left-6 h-8 w-8 text-white transition-opacity duration-300 z-10"
                    style={{ opacity: logoOpacity }}
                  />
                  
                  {/* Settings/Close buttons in top right */}
                  <div className="absolute top-4 right-4 flex gap-1 z-30">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-8 w-8">
                          <Settings01 className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Chat Settings</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setChatSettings((prev: any) => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                          className="flex items-center justify-between"
                        >
                          <span>Sound</span>
                          <div className={`w-9 h-5 rounded-full transition-colors ${chatSettings.soundEnabled ? 'bg-primary' : 'bg-muted'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${chatSettings.soundEnabled ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setChatSettings((prev: any) => ({ ...prev, autoScroll: !prev.autoScroll }))}
                          className="flex items-center justify-between"
                        >
                          <span>Auto-scroll</span>
                          <div className={`w-9 h-5 rounded-full transition-colors ${chatSettings.autoScroll ? 'bg-primary' : 'bg-muted'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${chatSettings.autoScroll ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-8 w-8" onClick={handleClose}>
                      <Minimize02 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Scrollable content overlay */}
                <div 
                  ref={homeContentRef}
                  onScroll={(e) => setHeaderScrollY(e.currentTarget.scrollTop)}
                  className="absolute inset-0 overflow-y-auto z-10"
                >
                  {/* Spacer to push content down initially - shows gradient */}
                  <div className="h-[140px]" />
                  
                  {/* Welcome text - visible over gradient */}
                  <div className="px-6 pb-4">
                    <h2 className="text-3xl font-bold text-white drop-shadow-sm">
                      {config.welcomeTitle} {config.welcomeEmoji}
                    </h2>
                    <p className="text-white/90 text-base drop-shadow-sm">{config.welcomeSubtitle}</p>
                  </div>
                  
                  {/* Content wrapper with gradient from transparent to white */}
                  <div className="bg-gradient-to-b from-transparent via-background via-30% to-background min-h-full relative z-20">
                    <div className="px-6 py-4 space-y-3">
                      {config.announcements.length > 0 && (
                        <div className="space-y-3 mb-6">
                          {config.announcements.map((announcement) => (
                            <div
                              key={announcement.id}
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
                          ))}
                        </div>
                      )}

                      <div className="space-y-3">
                        {config.quickActions.map((action) => (
                          <div
                            key={action.id}
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
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 flex items-center justify-between relative" style={getGradientStyle()}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <ChatBubbleIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{currentView === 'messages' ? config.agentName : 'Help Center'}</h3>
                    <p className="text-xs text-white/80">Online</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-8 w-8" onClick={handleClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Content - Only for non-home views */}
            {currentView !== 'home' && (
              <div className="flex-1 overflow-hidden bg-background flex flex-col">

              {currentView === 'messages' && (
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 messages-container">
                    {!chatUser && (
                      <div className="flex items-start">
                        <div className="bg-muted rounded-lg p-3 w-full">
                          <p className="text-sm font-medium mb-3">Quick intro before we chat 👋</p>
                          <form 
                            className="space-y-2"
                            onSubmit={async (e) => {
                              e.preventDefault();
                              const formData = new FormData(e.currentTarget);
                              const firstName = formData.get('firstName') as string;
                              const lastName = formData.get('lastName') as string;
                              const email = formData.get('email') as string;
                              const customFieldData: Record<string, any> = {};

                              config.customFields.forEach(field => {
                                customFieldData[field.id] = formData.get(field.id);
                              });

                              try {
                                const schema = z.object({
                                  firstName: z.string().trim().min(1).max(50),
                                  lastName: z.string().trim().min(1).max(50),
                                  email: z.string().trim().email().max(255),
                                });
                                schema.parse({ firstName, lastName, email });
                                setFormErrors({});

                                const { leadId } = await createLead(config.agentId, { firstName, lastName, email, customFields: customFieldData });
                                const userData = { firstName, lastName, email, leadId };
                                localStorage.setItem(`chatpad_user_${config.agentId}`, JSON.stringify(userData));
                                setChatUser(userData);
                                setActiveConversationId('new');
                                toast.success(`Welcome, ${firstName}!`);
                              } catch (error) {
                                if (error instanceof z.ZodError) {
                                  const errors: Record<string, string> = {};
                                  error.errors.forEach(err => {
                                    if (err.path[0]) errors[err.path[0] as string] = err.message;
                                  });
                                  setFormErrors(errors);
                                 }
                                 toast.error('Failed to start chat. Please try again.');
                               }
                             }}
                          >
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
                                ) : (
                                  <Input name={field.id} type={field.fieldType} placeholder={field.label} className="h-8 text-sm" required={field.required} />
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

                    {/* Empty Conversation State */}
                    {chatUser && !activeConversationId && messages.length <= 1 && (
                      <div className="flex-1 flex items-center justify-center p-8">
                        <div className="text-center space-y-4 max-w-sm">
                          <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                            <MessageChatCircle className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-semibold text-base">No conversations yet</h4>
                            <p className="text-sm text-muted-foreground">
                              Start a conversation with us and we'll be happy to help you.
                            </p>
                          </div>
                          <Button
                            onClick={() => setActiveConversationId('new')}
                            style={{ backgroundColor: config.primaryColor }}
                            className="w-full"
                          >
                            <MessageChatCircle className="h-4 w-4 mr-2" />
                            Start New Conversation
                          </Button>
                        </div>
                      </div>
                    )}

                    {messages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          {msg.type === 'audio' && msg.audioUrl && (
                            <AudioPlayer audioUrl={msg.audioUrl} primaryColor={config.primaryColor} />
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
                          
                          {config.enableMessageReactions && msg.reactions && msg.reactions.length > 0 && (
                            <MessageReactions
                              reactions={msg.reactions}
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
                            />
                          )}
                          
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <span className="text-xs opacity-70">{formatTimestamp(msg.timestamp)}</span>
                            {msg.role === 'user' && config.showReadReceipts && msg.read && <span className="text-xs opacity-70">Read</span>}
                          </div>
                        </div>
                      </div>
                    ))}

                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg p-3">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
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
                    {isAttachingFiles ? (
                      <FileDropZone
                        onFilesSelected={(files, urls) => {
                          files.forEach((file, i) => {
                            setPendingFiles(prev => [...prev, { file, preview: urls[i] || '' }]);
                          });
                          setIsAttachingFiles(false);
                          toast.success(`${files.length} file(s) attached`);
                        }}
                        onCancel={() => setIsAttachingFiles(false)}
                        primaryColor={config.primaryColor}
                      />
                    ) : isRecordingAudio ? (
                      <VoiceInput
                        onStart={startAudioRecording}
                        onStop={stopAudioRecording}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder={config.placeholder || 'Type a message...'}
                          className="flex-1 h-9"
                        />
                        {config.enableFileAttachments && (
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-9 w-9" 
                            onClick={() => setIsAttachingFiles(true)}
                          >
                            <Attachment01 className="h-4 w-4" />
                          </Button>
                        )}
                        {config.enableVoiceMessages && (
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-9 w-9" 
                            onClick={() => setIsRecordingAudio(true)}
                          >
                            <Microphone01 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          size="icon" 
                          className="h-9 w-9" 
                          onClick={handleSendMessage} 
                          style={{ backgroundColor: config.primaryColor }}
                        >
                          <Send01 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentView === 'help' && (
                <div className="flex-1 flex flex-col">
                  {/* Level 1: Categories List (No category selected, no search query) */}
                  {!selectedCategory && !selectedArticle && !helpSearchQuery && (
                    <>
                      <div className="p-4 border-b">
                        <h3 className="text-lg font-semibold mb-3">Help Center</h3>
                        <Input
                          value={helpSearchQuery}
                          onChange={(e) => setHelpSearchQuery(e.target.value)}
                          placeholder="Search help articles..."
                          className="h-9"
                        />
                      </div>

                      <div className="flex-1 overflow-y-auto p-4">
                        {config.helpCategories.length === 0 ? (
                          <p className="text-center text-muted-foreground text-sm py-8">No categories available</p>
                        ) : (
                          <div className="space-y-3">
                            {config.helpCategories.map((category) => {
                              const articlesInCategory = config.helpArticles.filter(
                                a => a.category_id === category.id || a.category === category.name
                              ).length;
                              
                              return (
                                <button
                                  key={category.id}
                                  className="w-full p-4 border rounded-lg bg-card hover:bg-accent/50 cursor-pointer transition-all text-left"
                                  onClick={() => setSelectedCategory(category.id)}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                      <h4 className="font-medium text-sm mb-1">{category.name}</h4>
                                      {category.description && (
                                        <p className="text-xs text-muted-foreground">{category.description}</p>
                                      )}
                                      <p className="text-xs text-muted-foreground mt-2">
                                        {articlesInCategory} {articlesInCategory === 1 ? 'article' : 'articles'}
                                      </p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Level 1b: Search Results (When user searches) */}
                  {!selectedCategory && !selectedArticle && helpSearchQuery && (
                    <>
                      <div className="p-4 border-b">
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
                        <Input
                          value={helpSearchQuery}
                          onChange={(e) => setHelpSearchQuery(e.target.value)}
                          placeholder="Search help articles..."
                          className="h-9"
                        />
                      </div>

                      <div className="flex-1 overflow-y-auto p-4">
                        {filteredArticles.length === 0 ? (
                          <p className="text-center text-muted-foreground text-sm py-8">No articles found</p>
                        ) : (
                          <div className="space-y-2">
                            {filteredArticles.map((article) => (
                              <div
                                key={article.id}
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
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Level 2: Articles in Category (Category selected, no article) */}
                  {selectedCategory && !selectedArticle && (
                    <>
                      <div className="p-4 border-b">
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
                          <p className="text-center text-muted-foreground text-sm py-8">No articles in this category</p>
                        ) : (
                          <div className="space-y-2">
                            {filteredArticles.map((article) => (
                              <button
                                key={article.id}
                                className="w-full p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors text-left"
                                onClick={() => setSelectedArticle(article)}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className="font-medium text-sm flex-1">{article.title}</h4>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Level 3: Article Content with Feedback */}
                  {selectedArticle && (
                    <div className="flex-1 overflow-y-auto">
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
                          className="prose prose-sm max-w-none text-sm whitespace-pre-wrap break-words" 
                          dangerouslySetInnerHTML={{ __html: selectedArticle.content }} 
                        />
                      </div>

                      {/* Feedback Section */}
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

                      {/* Still Need Help Button */}
                      <div className="p-4 border-t">
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={() => {
                            setCurrentView('messages');
                            if (!chatUser) {
                              setActiveConversationId('new');
                            }
                            toast.success('Starting a new conversation...');
                          }}
                        >
                          <MessageChatCircle className="h-4 w-4 mr-2" />
                          Still need help? Start Chat
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            )}

            {/* Bottom Navigation */}
            {config.showBottomNav && (
              <div className="border-t p-2 flex justify-around">
                <Button 
                  variant="ghost"
                  size="sm" 
                  onClick={() => {
                    setCurrentView('home');
                    setSelectedCategory(null);
                    setSelectedArticle(null);
                    setHelpSearchQuery('');
                  }} 
                  className={`flex-1 flex flex-col items-center gap-1 h-auto py-2 transition-colors ${
                    currentView === 'home' 
                      ? 'text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <HomeNavIcon active={currentView === 'home'} className="h-5 w-5" />
                  <span className="text-xs">Home</span>
                </Button>
                {config.enableMessagesTab && (
                  <Button 
                    variant="ghost"
                    size="sm" 
                    onClick={() => setCurrentView('messages')} 
                    className={`flex-1 flex flex-col items-center gap-1 h-auto py-2 relative transition-colors ${
                      currentView === 'messages' 
                        ? 'text-foreground' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <ChatNavIcon active={currentView === 'messages'} className="h-5 w-5" />
                    <span className="text-xs">Chat</span>
                    {messages.some(m => !m.read && m.role === 'assistant') && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                  </Button>
                )}
                {config.enableHelpTab && config.helpArticles.length > 0 && (
                  <Button 
                    variant="ghost"
                    size="sm" 
                    onClick={() => setCurrentView('help')} 
                    className={`flex-1 flex flex-col items-center gap-1 h-auto py-2 transition-colors ${
                      currentView === 'help' 
                        ? 'text-foreground' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <HelpNavIcon active={currentView === 'help'} className="h-5 w-5" />
                    <span className="text-xs">Help</span>
                  </Button>
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
              
              {/* Notification Badge */}
              {config.showBadge && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-background z-10" />
              )}
            </Button>
          </div>
        )}
      </div>
  );

  // In iframe mode, render directly without fixed positioning
  if (isIframeMode) {
    return (
      <div 
        className="w-full h-full light" 
        style={{
          colorScheme: 'light',
          '--background': '0 0% 100%',
          '--foreground': '0 0% 3.9%',
          '--card': '0 0% 100%',
          '--card-foreground': '0 0% 3.9%',
          '--popover': '0 0% 100%',
          '--popover-foreground': '0 0% 3.9%',
          '--primary': '221.2 83.2% 53.3%',
          '--primary-foreground': '210 40% 98%',
          '--secondary': '210 40% 96.1%',
          '--secondary-foreground': '222.2 47.4% 11.2%',
          '--muted': '210 40% 96.1%',
          '--muted-foreground': '215.4 16.3% 46.9%',
          '--accent': '210 40% 96.1%',
          '--accent-foreground': '222.2 47.4% 11.2%',
          '--destructive': '0 84.2% 60.2%',
          '--destructive-foreground': '210 40% 98%',
          '--border': '214.3 31.8% 91.4%',
          '--input': '214.3 31.8% 91.4%',
          '--ring': '221.2 83.2% 53.3%',
          '--radius': '0.5rem',
        } as React.CSSProperties}
      >
        {widgetContent}
        <Toaster position="top-center" richColors />
      </div>
    );
  }

  // Preview mode: Use fixed positioning with position classes
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[9999] light" 
      style={{
        colorScheme: 'light',
        '--background': '0 0% 100%',
        '--foreground': '0 0% 3.9%',
        '--card': '0 0% 100%',
        '--card-foreground': '0 0% 3.9%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '0 0% 3.9%',
        '--primary': '221.2 83.2% 53.3%',
        '--primary-foreground': '210 40% 98%',
        '--secondary': '210 40% 96.1%',
        '--secondary-foreground': '222.2 47.4% 11.2%',
        '--muted': '210 40% 96.1%',
        '--muted-foreground': '215.4 16.3% 46.9%',
        '--accent': '210 40% 96.1%',
        '--accent-foreground': '222.2 47.4% 11.2%',
        '--destructive': '0 84.2% 60.2%',
        '--destructive-foreground': '210 40% 98%',
        '--border': '214.3 31.8% 91.4%',
        '--input': '214.3 31.8% 91.4%',
        '--ring': '221.2 83.2% 53.3%',
        '--radius': '0.5rem',
      } as React.CSSProperties}
    >
      <div className={`absolute ${positionClasses[position]} pointer-events-auto`}>
        {widgetContent}
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
};
