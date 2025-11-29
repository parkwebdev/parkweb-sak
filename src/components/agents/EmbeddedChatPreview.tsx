import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Send01, Minimize02, Home05, MessageChatCircle, HelpCircle, ChevronRight, Zap, BookOpen01, Check, Microphone01, Attachment01, Settings01, Image03, FileCheck02 } from '@untitledui/icons';
import type { EmbeddedChatConfig } from '@/hooks/useEmbeddedChatConfig';
import { ChatBubbleIcon } from './ChatBubbleIcon';
import { AudioRecorder } from '@/components/chat/AudioRecorder';
import { AudioPlayer } from '@/components/chat/AudioPlayer';
import { FileDropZone } from '@/components/chat/FileDropZone';
import { MessageFileAttachment } from '@/components/chat/FileAttachment';
import { MessageReactions, Reaction } from '@/components/chat/MessageReactions';
import { BubbleBackground } from '@/components/ui/bubble-background';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { z } from 'zod';
import { toast } from 'sonner';

interface EmbeddedChatPreviewProps {
  config: EmbeddedChatConfig;
}

type ViewType = 'home' | 'messages' | 'help' | 'contact';

export const EmbeddedChatPreview = ({ config }: EmbeddedChatPreviewProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [isVisible, setIsVisible] = useState(config.displayTiming === 'immediate');
  const [showTeaser, setShowTeaser] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isAttachingFiles, setIsAttachingFiles] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [pendingFiles, setPendingFiles] = useState<Array<{ file: File; preview: string }>>([]);
  const [messages, setMessages] = useState<Array<{ 
    role: 'user' | 'assistant'; 
    content: string;
    read?: boolean;
    timestamp: Date;
    audioUrl?: string;
    type?: 'text' | 'audio' | 'file';
    files?: Array<{
      name: string;
      url: string;
      type: string;
      size: number;
    }>;
    reactions?: Reaction[];
  }>>([
    { role: 'assistant', content: config.greeting, read: true, timestamp: new Date(), type: 'text', reactions: [] },
  ]);

  // Chat settings state with localStorage persistence (removed compact mode)
  const [chatSettings, setChatSettings] = useState(() => {
    const saved = localStorage.getItem(`chatpad_settings_${config.agentId}`);
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      soundEnabled: config.defaultSoundEnabled ?? true,
      autoScroll: config.defaultAutoScroll ?? true,
    };
  });

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem(`chatpad_settings_${config.agentId}`, JSON.stringify(chatSettings));
  }, [chatSettings, config.agentId]);

  // Load messages from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(`chatpad_messages_${config.agentId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(messagesWithDates);
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    }
  }, [config.agentId]);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 1) { // Don't save just the greeting
      localStorage.setItem(`chatpad_messages_${config.agentId}`, JSON.stringify(messages));
    }
  }, [messages, config.agentId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatSettings.autoScroll && currentView === 'messages' && activeConversationId) {
      const messagesContainer = document.querySelector('.messages-container');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }
  }, [messages, chatSettings.autoScroll, currentView, activeConversationId]);
  
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Form validation schema
  const createFormSchema = () => {
    const schemaFields: Record<string, z.ZodTypeAny> = {
      firstName: z.string().trim().min(1, 'First name is required').max(50, 'First name must be less than 50 characters'),
      lastName: z.string().trim().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters'),
      email: z.string().trim().email('Invalid email address').max(255, 'Email must be less than 255 characters'),
    };

    config.customFields.forEach(field => {
      let fieldSchema: z.ZodTypeAny;
      
      switch (field.fieldType) {
        case 'email':
          fieldSchema = z.string().trim().email('Invalid email address');
          break;
        case 'phone':
          fieldSchema = z.string().trim().regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'Invalid phone number');
          break;
        case 'textarea':
          fieldSchema = z.string().trim().max(1000, 'Text must be less than 1000 characters');
          break;
        case 'select':
          fieldSchema = z.string().trim();
          break;
        default:
          fieldSchema = z.string().trim().max(100, 'Text must be less than 100 characters');
      }

      if (field.required) {
        fieldSchema = (fieldSchema as z.ZodString).min(1, `${field.label} is required`);
      } else {
        fieldSchema = fieldSchema.optional();
      }

      schemaFields[field.id] = fieldSchema;
    });

    return z.object(schemaFields);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() && pendingFiles.length === 0) return;

    if (pendingFiles.length > 0) {
      // Send message with files
      const newMessage = {
        role: 'user' as const,
        content: messageInput || 'Sent files',
        read: false,
        timestamp: new Date(),
        type: 'file' as const,
        files: pendingFiles.map(pf => ({
          name: pf.file.name,
          url: pf.preview,
          type: pf.file.type,
          size: pf.file.size,
        })),
        reactions: [],
      };
      setMessages(prev => [...prev, newMessage]);
      setPendingFiles([]);
    } else {
      // Send text message
      const newMessage = {
        role: 'user' as const,
        content: messageInput,
        read: false,
        timestamp: new Date(),
        type: 'text' as const,
        reactions: [],
      };
      setMessages(prev => [...prev, newMessage]);
    }
    
    setMessageInput('');

    // Play sound if enabled
    if (chatSettings.soundEnabled) {
      // Simple beep sound using Web Audio API
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

    // Simulate AI response
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant' as const,
        content: 'Thanks for your message! This is a demo response.',
        read: true,
        timestamp: new Date(),
        type: 'text' as const,
        reactions: [],
      }]);
      setIsTyping(false);
    }, 2000);
  };

  // Handle file selection for preview
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
    e.target.value = ''; // Reset input
  };

  // Remove file from preview
  const removeFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Helper to convert hex to RGB string for BubbleBackground
  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result 
      ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`
      : '0,0,0';
  };

  useEffect(() => {
    if (config.displayTiming === 'delayed') {
      const timer = setTimeout(() => {
        setIsVisible(true);
        if (config.showTeaser) {
          setTimeout(() => setShowTeaser(true), 300);
        }
      }, config.delaySeconds * 1000);
      return () => clearTimeout(timer);
    } else if (config.displayTiming === 'scroll') {
      const timer = setTimeout(() => {
        setIsVisible(true);
        if (config.showTeaser) {
          setTimeout(() => setShowTeaser(true), 300);
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else if (config.showTeaser) {
      const timer = setTimeout(() => setShowTeaser(true), 500);
      return () => clearTimeout(timer);
    }
  }, [config.displayTiming, config.delaySeconds, config.showTeaser]);

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

  const getTeaserPosition = () => {
    if (config.position.includes('right')) return 'right-0 mr-16';
    if (config.position.includes('left')) return 'left-0 ml-16';
    return 'right-0 mr-16';
  };

  const getTeaserVerticalPosition = () => {
    if (config.position.includes('bottom')) return 'bottom-0 mb-2';
    if (config.position.includes('top')) return 'top-0 mt-2';
    return 'bottom-0 mb-2';
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
    if (actionType === 'start_chat') {
      setCurrentView('messages');
      // Simulate agent typing after a moment
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
        }, 2000);
      }, 500);
    } else if (actionType === 'open_help') {
      setCurrentView('help');
    } else if (actionType === 'open_contact') {
      setCurrentView('contact');
    }
  };
  
  // Simulate read receipts - mark messages as read after viewing
  useEffect(() => {
    if (currentView === 'messages' && activeConversationId) {
      const timer = setTimeout(() => {
        setMessages(prev => prev.map(msg => ({ ...msg, read: true })));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentView, activeConversationId]);

  // Calculate gradient end color (lighter version of primary)
  const getGradientStyle = () => {
    if (!config.useGradientHeader) {
      return { backgroundColor: config.primaryColor };
    }
    return {
      background: `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.gradientEndColor} 100%)`,
    };
  };

  // Get transition classes based on config
  const getTransitionClasses = () => {
    switch (config.viewTransition) {
      case 'slide':
        return 'transition-transform duration-300 ease-out';
      case 'fade':
        return 'transition-opacity duration-300 ease-out';
      case 'none':
      default:
        return '';
    }
  };

  return (
    <div className="relative min-h-[700px] bg-muted/30 rounded-lg p-4 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
        <p>Website Preview Area</p>
      </div>

      {/* Chat Container */}
      {isVisible && (
        <div className={`absolute ${positionClasses[config.position]} z-10`}>
          {isOpen ? (
            <Card 
              className="w-[380px] max-h-[650px] flex flex-col shadow-xl overflow-hidden border-0"
            >
              {/* Header/Hero - Dynamic based on view */}
              {currentView === 'home' ? (
                // Large Hero Header for Home View
                <div className="relative h-[180px] overflow-hidden">
                  {/* Animated Background */}
                  <BubbleBackground 
                    interactive
                    colors={{
                      first: hexToRgb(config.primaryColor),
                      second: hexToRgb(config.gradientEndColor),
                      third: hexToRgb(config.primaryColor),
                      fourth: hexToRgb(config.gradientEndColor),
                      fifth: hexToRgb(config.primaryColor),
                      sixth: hexToRgb(config.gradientEndColor),
                    }}
                    className="absolute inset-0"
                  />
                  
                  {/* Hero Content */}
                  <div className="relative z-10 h-full flex flex-col items-start justify-center p-6 text-left">
                    {/* Team Avatars */}
                    {config.showTeamAvatars && config.teamAvatarUrls.length > 0 && (
                      <div className="flex -space-x-2 mb-4">
                        {config.teamAvatarUrls.slice(0, 3).map((avatarUrl, idx) => (
                          <Avatar key={idx} className="w-10 h-10 border-2 border-white ring-2 ring-white/20">
                            <AvatarImage src={avatarUrl} />
                            <AvatarFallback className="bg-white/20 text-white text-xs">
                              {String.fromCharCode(65 + idx)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    )}
                    
                    {/* Large Greeting */}
                    <div className="space-y-2">
                      <h2 className="text-3xl font-bold text-white">
                        {config.welcomeTitle} {config.welcomeEmoji}
                      </h2>
                      <p className="text-white/90 text-base">
                        {config.welcomeSubtitle}
                      </p>
                    </div>
                  </div>
                  
                  {/* Close and Settings buttons overlay */}
                  <div className="absolute top-3 right-3 z-20 flex gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-white hover:bg-white/10 h-8 w-8"
                        >
                          <Settings01 className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Chat Settings</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setChatSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                          className="flex items-center justify-between"
                        >
                          <span>Sound Notifications</span>
                          <div className={`w-9 h-5 rounded-full transition-colors ${chatSettings.soundEnabled ? 'bg-primary' : 'bg-muted'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${chatSettings.soundEnabled ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setChatSettings(prev => ({ ...prev, autoScroll: !prev.autoScroll }))}
                          className="flex items-center justify-between"
                        >
                          <span>Auto-Scroll</span>
                          <div className={`w-9 h-5 rounded-full transition-colors ${chatSettings.autoScroll ? 'bg-primary' : 'bg-muted'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${chatSettings.autoScroll ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/10 h-8 w-8"
                      onClick={() => setIsOpen(false)}
                    >
                      <Minimize02 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/10 h-8 w-8"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                // Compact Header for Messages/Help View
                <div 
                  className="p-4 flex items-center justify-between relative"
                  style={getGradientStyle()}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <ChatBubbleIcon className="h-6 w-6 text-white" />
                    </div>
                    
                    {currentView === 'messages' && (
                      <div>
                        <h3 className="font-semibold text-white">{config.agentName}</h3>
                        <p className="text-xs text-white/80">Online</p>
                      </div>
                    )}
                    
                    {currentView === 'help' && (
                      <div>
                        <h3 className="font-semibold text-white">Help Center</h3>
                        <p className="text-xs text-white/80">Browse articles</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/10 h-8 w-8"
                      onClick={() => setIsOpen(false)}
                    >
                      <Minimize02 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/10 h-8 w-8"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Content Area */}
              <div className="flex-1 overflow-hidden bg-background flex flex-col relative">
                {/* Home View */}
                {currentView === 'home' && (
                  <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${getTransitionClasses()} ${config.viewTransition === 'fade' ? 'opacity-100' : ''}`}>
                    {config.quickActions.map((action, idx) => (
                      <div
                        key={action.id}
                        className="p-4 border rounded-lg bg-card hover:bg-accent/50 cursor-pointer transition-all hover:shadow-md group animate-fade-in"
                        style={{ 
                          animationDelay: `${idx * 100}ms`,
                          animationFillMode: 'backwards'
                        }}
                        onClick={() => handleQuickActionClick(action.action)}
                      >
                        <div className="flex items-start gap-3">
                          <div 
                            className="p-2 rounded-lg shrink-0"
                            style={{ backgroundColor: `${config.primaryColor}15` }}
                          >
                            <div style={{ color: config.primaryColor }}>
                              {getQuickActionIcon(action.icon)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-medium text-sm">{action.title}</h4>
                              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{action.subtitle}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Contact Form View */}
                {currentView === 'contact' && (
                  <div className={`flex-1 overflow-y-auto p-4 ${getTransitionClasses()} ${config.viewTransition === 'fade' ? 'opacity-100' : ''}`}>
                    <div className="space-y-4">
                      {/* Form Header */}
                      <div className="text-center space-y-1">
                        <h3 className="text-lg font-semibold">{config.contactFormTitle}</h3>
                        <p className="text-sm text-muted-foreground">{config.contactFormSubtitle}</p>
                      </div>

                      {/* Contact Form */}
                      <form className="space-y-3" onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const data: Record<string, string> = {
                          firstName: formData.get('firstName') as string || '',
                          lastName: formData.get('lastName') as string || '',
                          email: formData.get('email') as string || '',
                        };

                        config.customFields.forEach(field => {
                          data[field.id] = formData.get(field.id) as string || '';
                        });

                        try {
                          const schema = createFormSchema();
                          schema.parse(data);
                          setFormErrors({});
                          
                          // Success - proceed to chat
                          toast.success('Form submitted successfully!');
                          setTimeout(() => {
                            setCurrentView('messages');
                            setActiveConversationId('new');
                            setMessages([{ 
                              role: 'assistant', 
                              content: 'Thanks for your information! How can I help you today?', 
                              read: true, 
                              timestamp: new Date(),
                              type: 'text',
                              reactions: []
                            }]);
                          }, 500);
                        } catch (error) {
                          if (error instanceof z.ZodError) {
                            const errors: Record<string, string> = {};
                            error.errors.forEach(err => {
                              if (err.path[0]) {
                                errors[err.path[0] as string] = err.message;
                              }
                            });
                            setFormErrors(errors);
                            toast.error('Please fix the form errors');
                          }
                        }
                      }}>
                        {/* Required Fields */}
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-sm">First Name *</Label>
                          <Input
                            id="firstName"
                            name="firstName"
                            placeholder="John"
                            className="text-sm"
                          />
                          {formErrors.firstName && (
                            <p className="text-xs text-destructive">{formErrors.firstName}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-sm">Last Name *</Label>
                          <Input
                            id="lastName"
                            name="lastName"
                            placeholder="Doe"
                            className="text-sm"
                          />
                          {formErrors.lastName && (
                            <p className="text-xs text-destructive">{formErrors.lastName}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm">Email *</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="john@example.com"
                            className="text-sm"
                          />
                          {formErrors.email && (
                            <p className="text-xs text-destructive">{formErrors.email}</p>
                          )}
                        </div>

                        {/* Custom Fields */}
                        {config.customFields.map((field) => (
                          <div key={field.id} className="space-y-2">
                            <Label htmlFor={field.id} className="text-sm">
                              {field.label} {field.required && '*'}
                            </Label>
                            {field.fieldType === 'textarea' ? (
                              <Textarea
                                id={field.id}
                                name={field.id}
                                placeholder={field.placeholder}
                                className="text-sm"
                                rows={3}
                              />
                            ) : field.fieldType === 'select' ? (
                              <Select name={field.id}>
                                <SelectTrigger className="text-sm">
                                  <SelectValue placeholder={field.placeholder || 'Select an option'} />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options?.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                id={field.id}
                                name={field.id}
                                type={field.fieldType}
                                placeholder={field.placeholder}
                                className="text-sm"
                              />
                            )}
                            {formErrors[field.id] && (
                              <p className="text-xs text-destructive">{formErrors[field.id]}</p>
                            )}
                          </div>
                        ))}

                        {/* Submit Button */}
                        <Button
                          type="submit"
                          className="w-full"
                          style={{ backgroundColor: config.primaryColor }}
                        >
                          Continue to Chat
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full"
                          onClick={() => setCurrentView('home')}
                        >
                          Back
                        </Button>
                      </form>
                    </div>
                  </div>
                )}

                {/* Messages View */}
                {currentView === 'messages' && (
                  <div className={`flex-1 flex flex-col ${getTransitionClasses()} ${config.viewTransition === 'fade' ? 'opacity-100' : ''}`}>
                    {activeConversationId ? (
                      <>
                        {/* Active Conversation */}
                        <div className={`flex-1 overflow-y-auto messages-container ${chatSettings.compactMode ? 'p-3 space-y-2' : 'p-4 space-y-3'}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mb-2"
                            onClick={() => setActiveConversationId(null)}
                          >
                            <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
                            Back to conversations
                          </Button>
                          {messages.map((msg, idx) => (
                            <div
                              key={idx}
                              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}
                            >
                               <div
                                 className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                   msg.role === 'user'
                                     ? 'text-white'
                                     : 'bg-muted'
                                 }`}
                                 style={msg.role === 'user' ? { backgroundColor: config.primaryColor } : {}}
                               >
                                 {msg.type === 'audio' && msg.audioUrl ? (
                                   <AudioPlayer audioUrl={msg.audioUrl} primaryColor={config.primaryColor} />
                                 ) : msg.type === 'file' && msg.files ? (
                                   <div className="space-y-2">
                                     {msg.content && <p className="text-sm mb-2">{msg.content}</p>}
                                     {msg.files.map((file, fileIdx) => (
                                       <MessageFileAttachment
                                         key={fileIdx}
                                         fileName={file.name}
                                         fileUrl={file.url}
                                         fileType={file.type}
                                         fileSize={file.size}
                                         primaryColor={config.primaryColor}
                                       />
                                     ))}
                                   </div>
                                 ) : (
                                   <p className="text-sm">{msg.content}</p>
                                 )}
                               </div>
                              
                               {/* Read Receipt */}
                               {config.showReadReceipts && msg.role === 'user' && (
                                 <div className="flex items-center gap-1 mt-1 px-1">
                                   {msg.read ? (
                                     <div className="flex">
                                       <Check className="h-3 w-3 text-primary -mr-1.5" />
                                       <Check className="h-3 w-3 text-primary" />
                                     </div>
                                   ) : (
                                     <Check className="h-3 w-3 text-muted-foreground" />
                                   )}
                                   <span className="text-xs text-muted-foreground">
                                     {msg.read ? 'Read' : 'Sent'}
                                   </span>
                                 </div>
                               )}
                               
                               {/* Emoji Reactions */}
                                {/* Emoji reactions - always enabled */}
                                {msg.reactions && msg.reactions.length > 0 && (
                                 <MessageReactions
                                   reactions={msg.reactions}
                                   onAddReaction={(emoji) => {
                                     setMessages(prev => prev.map((m, i) => {
                                       if (i === idx) {
                                         const existingReaction = m.reactions?.find(r => r.emoji === emoji);
                                         if (existingReaction) {
                                           return {
                                             ...m,
                                             reactions: m.reactions?.map(r =>
                                               r.emoji === emoji
                                                 ? { ...r, count: r.count + 1, userReacted: true }
                                                 : r
                                             ),
                                           };
                                         } else {
                                           return {
                                             ...m,
                                             reactions: [
                                               ...(m.reactions || []),
                                               { emoji, count: 1, userReacted: true },
                                             ],
                                           };
                                         }
                                       }
                                       return m;
                                     }));
                                   }}
                                   onRemoveReaction={(emoji) => {
                                     setMessages(prev => prev.map((m, i) => {
                                       if (i === idx) {
                                         return {
                                           ...m,
                                           reactions: m.reactions
                                             ?.map(r =>
                                               r.emoji === emoji
                                                 ? { ...r, count: r.count - 1, userReacted: false }
                                                 : r
                                             )
                                             .filter(r => r.count > 0),
                                         };
                                       }
                                       return m;
                                     }));
                                   }}
                                   primaryColor={config.primaryColor}
                                   compact={true}
                                 />
                               )}
                                
                                {(!msg.reactions || msg.reactions.length === 0) && (
                                 <MessageReactions
                                   reactions={[]}
                                   onAddReaction={(emoji) => {
                                     setMessages(prev => prev.map((m, i) => {
                                       if (i === idx) {
                                         return {
                                           ...m,
                                           reactions: [
                                             { emoji, count: 1, userReacted: true },
                                           ],
                                         };
                                       }
                                       return m;
                                     }));
                                   }}
                                   onRemoveReaction={() => {}}
                                   primaryColor={config.primaryColor}
                                   compact={true}
                                 />
                               )}
                             </div>
                           ))}
                          
                           {/* Typing Indicator - Always enabled, only shows when AI is responding */}
                          {isTyping && (
                            <div className="flex items-start animate-fade-in">
                              <div className="bg-muted rounded-lg px-4 py-3">
                                <div className="flex gap-1">
                                  <div 
                                    className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce"
                                    style={{ animationDelay: '0ms', animationDuration: '1s' }}
                                  />
                                  <div 
                                    className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce"
                                    style={{ animationDelay: '200ms', animationDuration: '1s' }}
                                  />
                                  <div 
                                    className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce"
                                    style={{ animationDelay: '400ms', animationDuration: '1s' }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Input */}
                        {isRecordingAudio ? (
                          <AudioRecorder
                            onRecordingComplete={(audioBlob: Blob) => {
                              const audioUrl = URL.createObjectURL(audioBlob);
                              const newMessage = {
                                role: 'user' as const,
                                content: 'Voice message',
                                audioUrl,
                                read: false,
                                timestamp: new Date(),
                                type: 'audio' as const,
                              };
                              setMessages(prev => [...prev, newMessage]);
                              setIsRecordingAudio(false);
                              
                              // Simulate AI response
                              setIsTyping(true);
                              setTimeout(() => {
                                setMessages(prev => [...prev, {
                                  role: 'assistant' as const,
                                  content: 'I received your voice message!',
                                  timestamp: new Date(),
                                  type: 'text' as const,
                                }]);
                                setIsTyping(false);
                              }, 2000);
                            }}
                            onCancel={() => setIsRecordingAudio(false)}
                            primaryColor={config.primaryColor}
                          />
                        ) : isAttachingFiles ? (
                          <FileDropZone
                            onFilesSelected={(files: File[], fileUrls: string[]) => {
                              const newMessage = {
                                role: 'user' as const,
                                content: files.length > 1 ? `${files.length} files` : files[0].name,
                                read: false,
                                timestamp: new Date(),
                                type: 'file' as const,
                                files: files.map((file, idx) => ({
                                  name: file.name,
                                  url: fileUrls[idx],
                                  type: file.type,
                                  size: file.size,
                                })),
                              };
                              setMessages(prev => [...prev, newMessage]);
                              setIsAttachingFiles(false);
                              
                              // Simulate AI response
                              setIsTyping(true);
                              setTimeout(() => {
                                setMessages(prev => [...prev, {
                                  role: 'assistant' as const,
                                  content: `I received your ${files.length > 1 ? 'files' : 'file'}!`,
                                  timestamp: new Date(),
                                  type: 'text' as const,
                                }]);
                                setIsTyping(false);
                              }, 2000);
                            }}
                            onCancel={() => setIsAttachingFiles(false)}
                            primaryColor={config.primaryColor}
                          />
                        ) : (
                          <div className="border-t">
                            {/* File Preview Thumbnails */}
                            {pendingFiles.length > 0 && (
                              <div className="p-3 bg-muted/30 border-b flex gap-2 overflow-x-auto">
                                {pendingFiles.map((pf, idx) => (
                                  <div key={idx} className="relative group flex-shrink-0">
                                    {pf.file.type.startsWith('image/') ? (
                                      <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
                                        <img src={pf.preview} alt={pf.file.name} className="w-full h-full object-cover" />
                                        <Button
                                          size="icon"
                                          variant="destructive"
                                          className="absolute -top-1 -right-1 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={() => removeFile(idx)}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="relative w-16 h-16 rounded-lg border bg-muted flex flex-col items-center justify-center p-1">
                                        <FileCheck02 className="h-6 w-6 text-muted-foreground" />
                                        <span className="text-[8px] text-muted-foreground truncate w-full text-center mt-0.5">
                                          {pf.file.name}
                                        </span>
                                        <Button
                                          size="icon"
                                          variant="destructive"
                                          className="absolute -top-1 -right-1 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={() => removeFile(idx)}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            <div className="p-4">
                              <div className="flex gap-2">
                                <Input
                                  placeholder={config.placeholder}
                                  className="flex-1"
                                  value={messageInput}
                                  onChange={(e) => setMessageInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleSendMessage();
                                    }
                                  }}
                                 />
                                {/* File attachments - always enabled */}
                                <>
                                    <input
                                      type="file"
                                      id="file-upload"
                                      multiple
                                      className="hidden"
                                      accept={config.allowedFileTypes.includes('image') ? 'image/*' : ''}
                                      onChange={handleFileSelect}
                                    />
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      onClick={() => document.getElementById('file-upload')?.click()}
                                    >
                                      <Attachment01 className="h-4 w-4" />
                                    </Button>
                                   </>
                                {/* Audio messages - always enabled */}
                                <>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => setIsRecordingAudio(true)}
                                  >
                                    <Microphone01 className="h-4 w-4" />
                                   </Button>
                                 </>
                                <Button
                                  size="icon" 
                                  style={{ backgroundColor: config.primaryColor }}
                                  onClick={handleSendMessage}
                                >
                                  <Send01 className="h-4 w-4 text-white" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Empty State - No conversation history */}
                        <div className="flex-1 flex items-center justify-center p-8">
                          <div className="text-center space-y-3">
                            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                              <MessageChatCircle className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm">No conversations yet</h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                Start a new conversation to get started
                              </p>
                            </div>
                            <Button
                              className="mt-4"
                              style={{ backgroundColor: config.primaryColor }}
                              onClick={() => {
                                setActiveConversationId('new');
                                setMessages([{ role: 'assistant', content: config.greeting, read: true, timestamp: new Date(), type: 'text', reactions: [] }]);
                              }}
                            >
                              <MessageChatCircle className="h-4 w-4 mr-2" />
                              Start New Conversation
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Help View */}
                {currentView === 'help' && (
                  <div className={`flex-1 overflow-y-auto p-4 ${getTransitionClasses()} ${config.viewTransition === 'fade' ? 'opacity-100' : ''}`}>
                    <div className="space-y-2">
                      {['Getting Started', 'Common Questions', 'Troubleshooting'].map((topic, idx) => (
                        <div
                          key={topic}
                          className="p-3 border rounded-lg hover:bg-accent/50 cursor-pointer transition-all animate-fade-in"
                          style={{ 
                            animationDelay: `${idx * 100}ms`,
                            animationFillMode: 'backwards'
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{topic}</span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Navigation */}
              {config.showBottomNav && (
                <div className="border-t bg-background">
                  <div className="flex items-center justify-around p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`flex-1 flex flex-col items-center gap-1 h-auto py-2 ${currentView === 'home' ? 'text-primary' : 'text-muted-foreground'}`}
                      onClick={() => setCurrentView('home')}
                    >
                      <Home05 className="h-5 w-5" />
                      <span className="text-xs">Home</span>
                    </Button>
                    
                    {config.enableMessagesTab && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`flex-1 flex flex-col items-center gap-1 h-auto py-2 relative ${currentView === 'messages' ? 'text-primary' : 'text-muted-foreground'}`}
                        onClick={() => setCurrentView('messages')}
                      >
                        <MessageChatCircle className="h-5 w-5" />
                        <span className="text-xs">Messages</span>
                        {config.showBadge && currentView !== 'messages' && (
                          <div className="absolute top-1 right-1/4 w-2 h-2 bg-red-500 rounded-full" />
                        )}
                      </Button>
                    )}
                    
                    {config.enableHelpTab && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`flex-1 flex flex-col items-center gap-1 h-auto py-2 ${currentView === 'help' ? 'text-primary' : 'text-muted-foreground'}`}
                        onClick={() => setCurrentView('help')}
                      >
                        <HelpCircle className="h-5 w-5" />
                        <span className="text-xs">Help</span>
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Branding */}
              {config.showBranding && !config.showBottomNav && (
                <div className="p-2 border-t">
                  <p className="text-xs text-center text-muted-foreground">
                    Powered by Your Company
                  </p>
                </div>
              )}
            </Card>
          ) : (
            <div className="relative flex items-end gap-3">
              {/* Teaser Text */}
              {config.showTeaser && showTeaser && !isOpen && (
                <div 
                  className={`absolute ${getTeaserVerticalPosition()} ${getTeaserPosition()} max-w-[200px] animate-fade-in`}
                  onClick={() => setIsOpen(true)}
                >
                  <div 
                    className="bg-background border shadow-lg rounded-lg px-4 py-2 cursor-pointer hover:shadow-xl transition-shadow"
                    style={{ borderColor: config.primaryColor }}
                  >
                    <p className="text-sm font-medium" style={{ color: config.primaryColor }}>
                      {config.teaserText}
                    </p>
                    <div 
                      className={`absolute ${config.position.includes('bottom') ? 'bottom-3' : 'top-3'} ${config.position.includes('right') ? '-right-2' : '-left-2'} w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ${config.position.includes('right') ? 'border-l-[8px]' : 'border-r-[8px]'}`}
                      style={{ 
                        [config.position.includes('right') ? 'borderLeftColor' : 'borderRightColor']: config.primaryColor 
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="relative">
                {/* Pulse Ring Animation */}
                {config.animation === 'ring' && (
                  <>
                    <div 
                      className="absolute inset-0 rounded-full animate-ping"
                      style={{ 
                        backgroundColor: config.primaryColor,
                        opacity: 0.75,
                      }}
                    />
                    <div 
                      className="absolute inset-0 rounded-full animate-pulse"
                      style={{ 
                        backgroundColor: config.primaryColor,
                        opacity: 0.5,
                      }}
                    />
                  </>
                )}
                
                {/* Notification Badge */}
                {config.showBadge && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-background z-10" />
                )}
                
                <Button
                  size="icon"
                  className={`w-16 h-16 rounded-full shadow-lg relative ${animationClasses[config.animation]} hover:scale-110 transition-transform`}
                  style={{ backgroundColor: config.primaryColor }}
                  onClick={() => {
                    setIsOpen(true);
                    setShowTeaser(false);
                  }}
                >
                  <ChatBubbleIcon className="h-8 w-8 text-white" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};