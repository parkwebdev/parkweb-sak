import { useState, useEffect, useRef } from 'react';
import { fetchWidgetConfig, createLead, type WidgetConfig } from './api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { X, Send01, Minimize02, Home05, MessageChatCircle, HelpCircle, ChevronRight, Zap, BookOpen01, Settings01 } from '@untitledui/icons';
import { ChatBubbleIcon } from '@/components/agents/ChatBubbleIcon';
import { BubbleBackground } from '@/components/ui/bubble-background';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { z } from 'zod';

interface ChatWidgetProps {
  config: {
    agentId: string;
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    primaryColor?: string;
  };
}

type ViewType = 'home' | 'messages' | 'help';

interface ChatUser {
  firstName: string;
  lastName: string;
  email: string;
  leadId: string;
}

export const ChatWidget = ({ config: initialConfig }: ChatWidgetProps) => {
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [chatUser, setChatUser] = useState<ChatUser | null>(() => {
    const stored = localStorage.getItem(`chatpad_user_${initialConfig.agentId}`);
    return stored ? JSON.parse(stored) : null;
  });
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Array<{ 
    role: 'user' | 'assistant'; 
    content: string;
    read?: boolean;
    timestamp: Date;
    type?: 'text';
    reactions?: any[];
  }>>([]);

  const [chatSettings, setChatSettings] = useState(() => {
    const saved = localStorage.getItem(`chatpad_settings_${initialConfig.agentId}`);
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      soundEnabled: true,
      autoScroll: true,
    };
  });

  // Load config on mount
  useEffect(() => {
    fetchWidgetConfig(initialConfig.agentId)
      .then(cfg => {
        setConfig(cfg);
        setMessages([{ 
          role: 'assistant', 
          content: cfg.greeting, 
          read: true, 
          timestamp: new Date(),
          type: 'text',
          reactions: []
        }]);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load config:', err);
        setLoading(false);
      });
  }, [initialConfig.agentId]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem(`chatpad_settings_${initialConfig.agentId}`, JSON.stringify(chatSettings));
  }, [chatSettings, initialConfig.agentId]);

  // Update greeting based on user status
  useEffect(() => {
    if (chatUser && config) {
      setMessages([{ 
        role: 'assistant', 
        content: `Welcome back, ${chatUser.firstName}! 👋 How can I help you today?`, 
        read: true, 
        timestamp: new Date(),
        type: 'text',
        reactions: []
      }]);
    } else if (config) {
      setMessages([{ 
        role: 'assistant', 
        content: config.greeting, 
        read: true, 
        timestamp: new Date(), 
        type: 'text', 
        reactions: [] 
      }]);
    }
  }, [chatUser, config]);

  if (loading || !config) {
    return null;
  }

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result 
      ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`
      : '0,0,0';
  };

  const getGradientStyle = () => {
    if (!config.useGradientHeader) {
      return { backgroundColor: config.primaryColor };
    }
    return {
      background: `linear-gradient(135deg, ${config.gradientStartColor} 0%, ${config.gradientEndColor} 100%)`,
    };
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
      if (!chatUser) {
        setActiveConversationId('new');
      }
    } else if (actionType === 'open_help') {
      setCurrentView('help');
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    const newMessage = {
      role: 'user' as const,
      content: messageInput,
      read: false,
      timestamp: new Date(),
      type: 'text' as const,
      reactions: [],
    };
    setMessages(prev => [...prev, newMessage]);
    setMessageInput('');

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

  const position = (initialConfig.position || 'bottom-right') as keyof typeof positionClasses;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <div className={`absolute ${positionClasses[position]} pointer-events-auto`}>
        {isOpen ? (
          <Card className="w-[380px] max-h-[650px] flex flex-col shadow-xl overflow-hidden border-0">
            {/* Header */}
            {currentView === 'home' ? (
              <div className="relative h-[180px] overflow-hidden">
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
                
                <div className="relative z-10 h-full flex flex-col items-start justify-center p-6 text-left">
                  {config.teamAvatarUrl && (
                    <div className="flex -space-x-2 mb-4">
                      <Avatar className="w-10 h-10 border-2 border-white ring-2 ring-white/20">
                        <AvatarImage src={config.teamAvatarUrl} />
                        <AvatarFallback className="bg-white/20 text-white text-xs">A</AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-white">
                      {config.welcomeTitle}
                    </h2>
                    <p className="text-white/90 text-base">
                      {config.welcomeSubtitle}
                    </p>
                  </div>
                </div>
                
                <div className="absolute top-3 right-3 z-20 flex gap-1">
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
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-8 w-8" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 flex items-center justify-between relative" style={getGradientStyle()}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <ChatBubbleIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      {currentView === 'messages' ? config.agentName : 'Help Center'}
                    </h3>
                    <p className="text-xs text-white/80">Online</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-8 w-8" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-hidden bg-background flex flex-col">
              {currentView === 'home' && (
                <div className="flex-1 overflow-y-auto p-4">
                  {config.announcements.length > 0 && (
                    <div className="space-y-3 mb-6">
                      {config.announcements.map((announcement) => (
                        <div
                          key={announcement.id}
                          className="rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                          style={{ backgroundColor: announcement.background_color }}
                          onClick={() => {
                            if (announcement.action_type === 'start_chat') {
                              setCurrentView('messages');
                            } else if (announcement.action_type === 'open_help') {
                              setCurrentView('help');
                            }
                          }}
                        >
                          {announcement.image_url && (
                            <div className="h-32 overflow-hidden">
                              <img src={announcement.image_url} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="p-4 flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-base" style={{ color: announcement.title_color }}>
                                {announcement.title}
                              </h3>
                              {announcement.subtitle && (
                                <p className="text-sm text-muted-foreground mt-1">{announcement.subtitle}</p>
                              )}
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
                        onClick={() => handleQuickActionClick(action.actionType)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: `${config.primaryColor}15` }}>
                            <div style={{ color: config.primaryColor }}>
                              {getQuickActionIcon(action.icon)}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-medium text-sm">{action.label}</h4>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentView === 'messages' && (
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
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

                              try {
                                const schema = z.object({
                                  firstName: z.string().trim().min(1).max(50),
                                  lastName: z.string().trim().min(1).max(50),
                                  email: z.string().trim().email().max(255),
                                });
                                schema.parse({ firstName, lastName, email });
                                setFormErrors({});

                                const { leadId } = await createLead(config.agentId, {
                                  firstName,
                                  lastName,
                                  email,
                                  customFields: {}
                                });

                                const userData = { firstName, lastName, email, leadId };
                                localStorage.setItem(`chatpad_user_${config.agentId}`, JSON.stringify(userData));
                                setChatUser(userData);
                              } catch (error) {
                                if (error instanceof z.ZodError) {
                                  const errors: Record<string, string> = {};
                                  error.errors.forEach(err => {
                                    if (err.path[0]) errors[err.path[0] as string] = err.message;
                                  });
                                  setFormErrors(errors);
                                }
                              }
                            }}
                          >
                            <Input name="firstName" placeholder="First name" className="h-8 text-sm" required />
                            {formErrors.firstName && <p className="text-xs text-destructive">{formErrors.firstName}</p>}
                            <Input name="lastName" placeholder="Last name" className="h-8 text-sm" required />
                            {formErrors.lastName && <p className="text-xs text-destructive">{formErrors.lastName}</p>}
                            <Input name="email" type="email" placeholder="Email" className="h-8 text-sm" required />
                            {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
                            <Button type="submit" size="sm" className="w-full h-8" style={{ backgroundColor: config.primaryColor }}>
                              Start Chat
                            </Button>
                          </form>
                        </div>
                      </div>
                    )}

                    {messages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div 
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.role === 'user' 
                              ? 'text-white' 
                              : 'bg-muted'
                          }`}
                          style={msg.role === 'user' ? { backgroundColor: config.primaryColor } : undefined}
                        >
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </div>
                    ))}

                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg p-3">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {chatUser && (
                    <div className="p-4 border-t">
                      <div className="flex gap-2">
                        <Input
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="Type a message..."
                          className="flex-1"
                        />
                        <Button size="icon" onClick={handleSendMessage} style={{ backgroundColor: config.primaryColor }}>
                          <Send01 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentView === 'help' && (
                <div className="flex-1 overflow-y-auto p-4">
                  <p className="text-sm text-muted-foreground">Help articles will appear here</p>
                </div>
              )}
            </div>

            {/* Bottom Nav */}
            {config.showBottomNav && (
              <div className="border-t p-2 grid grid-cols-3 gap-1">
                {config.showHomeTab && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={currentView === 'home' ? 'bg-accent' : ''}
                    onClick={() => setCurrentView('home')}
                  >
                    <Home05 className="h-4 w-4 mr-1" />
                    Home
                  </Button>
                )}
                {config.showMessagesTab && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={currentView === 'messages' ? 'bg-accent' : ''}
                    onClick={() => {
                      setCurrentView('messages');
                      if (!chatUser) setActiveConversationId('new');
                    }}
                  >
                    <MessageChatCircle className="h-4 w-4 mr-1" />
                    Messages
                  </Button>
                )}
                {config.showHelpTab && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={currentView === 'help' ? 'bg-accent' : ''}
                    onClick={() => setCurrentView('help')}
                  >
                    <HelpCircle className="h-4 w-4 mr-1" />
                    Help
                  </Button>
                )}
              </div>
            )}
          </Card>
        ) : (
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-xl"
            style={{ backgroundColor: initialConfig.primaryColor || config.primaryColor }}
            onClick={() => setIsOpen(true)}
          >
            <ChatBubbleIcon className="h-6 w-6 text-white" />
          </Button>
        )}
      </div>
    </div>
  );
};
