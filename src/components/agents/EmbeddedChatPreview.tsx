import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send01, Minimize02, Home05, MessageChatCircle, HelpCircle, ChevronRight, Zap, BookOpen01 } from '@untitledui/icons';
import type { EmbeddedChatConfig } from '@/hooks/useEmbeddedChatConfig';
import { ChatBubbleIcon } from './ChatBubbleIcon';

interface EmbeddedChatPreviewProps {
  config: EmbeddedChatConfig;
}

type ViewType = 'home' | 'messages' | 'help';

export const EmbeddedChatPreview = ({ config }: EmbeddedChatPreviewProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [isVisible, setIsVisible] = useState(config.displayTiming === 'immediate');
  const [showTeaser, setShowTeaser] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: config.greeting },
  ]);
  
  // Mock conversation history
  const conversations = [
    {
      id: '1',
      preview: 'I need help with my account settings',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      unread: true,
    },
    {
      id: '2',
      preview: 'Question about pricing plans',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      unread: false,
    },
    {
      id: '3',
      preview: 'Technical support request',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
      unread: false,
    },
  ];
  
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
      default: return <MessageChatCircle className="h-5 w-5" />;
    }
  };

  const handleQuickActionClick = (actionType: string) => {
    if (actionType === 'start_chat') {
      setCurrentView('messages');
    } else if (actionType === 'open_help') {
      setCurrentView('help');
    }
  };

  // Calculate gradient end color (lighter version of primary)
  const getGradientStyle = () => {
    if (!config.useGradientHeader) {
      return { backgroundColor: config.primaryColor };
    }
    return {
      background: `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.gradientEndColor} 100%)`,
    };
  };

  return (
    <div className="relative h-[600px] bg-muted/30 rounded-lg p-4 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
        <p>Website Preview Area</p>
      </div>

      {/* Chat Container */}
      {isVisible && (
        <div className={`absolute ${positionClasses[config.position]} z-10`}>
          {isOpen ? (
            <Card 
              className="w-[380px] h-[600px] flex flex-col shadow-xl overflow-hidden"
              style={{ 
                borderColor: config.primaryColor,
                borderWidth: '2px',
              }}
            >
              {/* Gradient Header */}
              <div 
                className="p-4 flex items-center justify-between relative"
                style={getGradientStyle()}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <ChatBubbleIcon className="h-6 w-6 text-white" />
                  </div>
                  
                  {currentView === 'home' && (
                    <div>
                      <h3 className="font-semibold text-white text-lg">{config.welcomeTitle} {config.welcomeEmoji}</h3>
                      <p className="text-xs text-white/90">{config.welcomeSubtitle}</p>
                    </div>
                  )}
                  
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

              {/* Content Area */}
              <div className="flex-1 overflow-hidden bg-background flex flex-col">
                {/* Home View */}
                {currentView === 'home' && (
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {config.showQuickActions && config.quickActions.map((action, idx) => (
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

                {/* Messages View */}
                {currentView === 'messages' && (
                  <>
                    {activeConversationId ? (
                      <>
                        {/* Active Conversation */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                            >
                              <div
                                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                  msg.role === 'user'
                                    ? 'text-white'
                                    : 'bg-muted'
                                }`}
                                style={msg.role === 'user' ? { backgroundColor: config.primaryColor } : {}}
                              >
                                <p className="text-sm">{msg.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t">
                          <div className="flex gap-2">
                            <Input
                              placeholder={config.placeholder}
                              className="flex-1"
                            />
                            <Button size="icon" style={{ backgroundColor: config.primaryColor }}>
                              <Send01 className="h-4 w-4 text-white" />
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Conversation History List */}
                        <div className="flex-1 overflow-y-auto">
                          <div className="p-3 border-b bg-muted/30">
                            <h4 className="text-sm font-semibold">Your Conversations</h4>
                          </div>
                          <div className="divide-y">
                            {conversations.map((conv, idx) => (
                              <div
                                key={conv.id}
                                className="p-4 hover:bg-accent/50 cursor-pointer transition-all animate-fade-in"
                                style={{ 
                                  animationDelay: `${idx * 50}ms`,
                                  animationFillMode: 'backwards'
                                }}
                                onClick={() => setActiveConversationId(conv.id)}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className={`text-sm truncate ${conv.unread ? 'font-semibold' : 'font-normal'}`}>
                                        {conv.preview}
                                      </p>
                                      {conv.unread && (
                                        <div className="w-2 h-2 bg-primary rounded-full shrink-0" />
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {formatTimestamp(conv.timestamp)}
                                    </p>
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* New Conversation Button */}
                          <div className="p-3 border-t">
                            <Button
                              className="w-full"
                              style={{ backgroundColor: config.primaryColor }}
                              onClick={() => {
                                setActiveConversationId('new');
                                setMessages([{ role: 'assistant', content: config.greeting }]);
                              }}
                            >
                              <MessageChatCircle className="h-4 w-4 mr-2" />
                              Start New Conversation
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* Help View */}
                {currentView === 'help' && (
                  <div className="flex-1 overflow-y-auto p-4">
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
                {/* Subtle Pulsating Ring Animation */}
                {config.animation === 'ring' && (
                  <>
                    <div 
                      className="absolute inset-0 w-12 h-12 rounded-full opacity-10"
                      style={{ 
                        backgroundColor: config.primaryColor,
                        animation: 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite'
                      }}
                    />
                    <div 
                      className="absolute inset-0 w-12 h-12 rounded-full opacity-5"
                      style={{ 
                        backgroundColor: config.primaryColor,
                        animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite'
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
                  className={`w-12 h-12 rounded-full shadow-lg relative ${animationClasses[config.animation]} hover:scale-110 transition-transform`}
                  style={{ backgroundColor: config.primaryColor }}
                  onClick={() => {
                    setIsOpen(true);
                    setShowTeaser(false);
                  }}
                >
                  <ChatBubbleIcon className="h-10 w-10 text-white" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};