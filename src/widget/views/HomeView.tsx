import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, MessageChatCircle, BookOpen01, Zap } from '@untitledui/icons';
import ChatPadLogo from '@/components/ChatPadLogo';
import { CSSAnimatedList } from '../CSSAnimatedList';
import { CSSAnimatedItem } from '../CSSAnimatedItem';
import { CSSBubbleBackground } from '@/components/ui/css-bubble-background';
import { generateGradientPalette, hexToRgb } from '@/lib/color-utils';
import type { WidgetConfig } from '../api';

interface HomeViewProps {
  config: WidgetConfig;
  isOpen: boolean;
  isIframeMode: boolean;
  isContentLoading: boolean;
  logoOpacity: number;
  onClose: () => void;
  onQuickActionClick: (actionType: string) => void;
  onScrollChange: (scrollY: number) => void;
}

export const HomeView = ({
  config,
  isOpen,
  isIframeMode,
  isContentLoading,
  logoOpacity,
  onClose,
  onQuickActionClick,
  onScrollChange,
}: HomeViewProps) => {
  const homeContentRef = useRef<HTMLDivElement>(null);

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

  // Calculate logo opacity based on scroll (graceful fade over 120px with easing)
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    onScrollChange(e.currentTarget.scrollTop);
  };

  return (
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
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Scrollable content overlay */}
      <div 
        ref={homeContentRef}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-auto z-10 flex flex-col"
      >
        {/* Spacer to push content down initially - shows gradient */}
        <div className="h-[140px]" />
        
        {/* Welcome text - visible over gradient */}
        <div 
          className="px-6 pb-6 transition-opacity duration-300"
          style={{ opacity: logoOpacity }}
        >
          {isContentLoading ? (
            <div className="space-y-2">
              <span className="inline-block w-24 h-8 bg-white/20 rounded animate-pulse" />
              <span className="inline-block w-48 h-5 bg-white/20 rounded animate-pulse" />
            </div>
          ) : (
            <>
              {/* Large title with emoji */}
              <h2 className="text-3xl font-bold text-white">
                {config.welcomeTitle || 'Hi'} {config.welcomeEmoji && <span>{config.welcomeEmoji}</span>}
              </h2>
              {/* Smaller subtitle below */}
              <p className="text-lg font-medium text-white/80 mt-1">
                {config.welcomeSubtitle || 'How can we help you today?'}
              </p>
            </>
          )}
        </div>
        
        {/* Content area - container fades from transparent to white */}
        <div className="relative flex-1 flex flex-col">
          <div 
            className="p-5 pt-8 space-y-4 flex-1"
            style={{
              background: 'linear-gradient(to bottom, transparent 0%, transparent 80px, white 160px, white 100%)'
            }}
          >
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
                          className="rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98] bg-white border shadow-sm"
                          onClick={() => {
                            if (announcement.action_type === 'open_url' && announcement.action_url) {
                              window.open(announcement.action_url, '_blank', 'noopener,noreferrer');
                            } else if (announcement.action_type === 'start_chat') {
                              onQuickActionClick('start_chat');
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
                              <h4 className="font-semibold text-sm line-clamp-2 text-foreground">
                                {announcement.title}
                              </h4>
                              {announcement.subtitle && (
                                <p className="text-xs mt-0.5 line-clamp-2 text-muted-foreground">
                                  {announcement.subtitle}
                                </p>
                              )}
                            </div>
                            <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
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
                        onClick={() => onQuickActionClick(action.action || action.actionType)}
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
  );
};
