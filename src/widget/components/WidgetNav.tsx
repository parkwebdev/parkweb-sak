import { useState } from 'react';
import { HomeNavIcon, ChatNavIcon, HelpNavIcon, NewsNavIcon } from '../NavIcons';
import type { ViewType } from '../types';

interface WidgetNavProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  unreadCount: number;
  primaryColor: string;
  onMessagesClick?: () => void;
  enableHelpTab?: boolean;
  enableNewsTab?: boolean;
}

export const WidgetNav = ({
  currentView,
  onViewChange,
  unreadCount,
  primaryColor,
  onMessagesClick,
  enableHelpTab = true,
  enableNewsTab = false,
}: WidgetNavProps) => {
  const [hoveredNav, setHoveredNav] = useState<'home' | 'messages' | 'help' | 'news' | null>(null);

  const handleMessagesClick = () => {
    onViewChange('messages');
    onMessagesClick?.();
  };

  return (
    <div className="px-6 py-3 border-t bg-background flex justify-around items-center">
      <button
        onClick={() => onViewChange('home')}
        onMouseEnter={() => setHoveredNav('home')}
        onMouseLeave={() => setHoveredNav(null)}
        className="flex flex-col items-center gap-1 py-1"
      >
        <HomeNavIcon 
          active={currentView === 'home'} 
          hovered={hoveredNav === 'home'}
        />
        <span className={`text-xs ${currentView === 'home' ? 'font-medium' : 'text-muted-foreground'}`} style={currentView === 'home' ? { color: primaryColor } : undefined}>
          Home
        </span>
      </button>

      <button
        onClick={handleMessagesClick}
        onMouseEnter={() => setHoveredNav('messages')}
        onMouseLeave={() => setHoveredNav(null)}
        className="flex flex-col items-center gap-1 py-1 relative"
      >
        <div className="relative">
          <ChatNavIcon 
            active={currentView === 'messages'} 
            hovered={hoveredNav === 'messages'}
          />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        <span className={`text-xs ${currentView === 'messages' ? 'font-medium' : 'text-muted-foreground'}`} style={currentView === 'messages' ? { color: primaryColor } : undefined}>
          Messages
        </span>
      </button>

      {enableNewsTab && (
        <button
          onClick={() => onViewChange('news')}
          onMouseEnter={() => setHoveredNav('news')}
          onMouseLeave={() => setHoveredNav(null)}
          className="flex flex-col items-center gap-1 py-1"
        >
          <NewsNavIcon 
            active={currentView === 'news'} 
            hovered={hoveredNav === 'news'}
          />
          <span className={`text-xs ${currentView === 'news' ? 'font-medium' : 'text-muted-foreground'}`} style={currentView === 'news' ? { color: primaryColor } : undefined}>
            News
          </span>
        </button>
      )}

      {enableHelpTab && (
        <button
          onClick={() => onViewChange('help')}
          onMouseEnter={() => setHoveredNav('help')}
          onMouseLeave={() => setHoveredNav(null)}
          className="flex flex-col items-center gap-1 py-1"
        >
          <HelpNavIcon 
            active={currentView === 'help'} 
            hovered={hoveredNav === 'help'}
          />
          <span className={`text-xs ${currentView === 'help' ? 'font-medium' : 'text-muted-foreground'}`} style={currentView === 'help' ? { color: primaryColor } : undefined}>
            Help
          </span>
        </button>
      )}
    </div>
  );
};
