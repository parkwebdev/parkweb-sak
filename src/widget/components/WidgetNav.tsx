/**
 * WidgetNav Component
 * 
 * Bottom navigation bar with Home, Messages, News, and Help tabs.
 * Displays unread message count badge and supports icon fill animations.
 * 
 * @module widget/components/WidgetNav
 */

import { useState } from 'react';
import { HomeNavIcon, ChatNavIcon, HelpNavIcon, NewsNavIcon } from '../NavIcons';
import type { ViewType } from '../types';

/** Props for the WidgetNav component */
interface WidgetNavProps {
  /** Currently active view */
  currentView: ViewType;
  /** View change handler */
  onViewChange: (view: ViewType) => void;
  /** Number of unread messages */
  unreadCount: number;
  /** Primary brand color for active state */
  primaryColor: string;
  /** Optional messages click handler */
  onMessagesClick?: () => void;
  /** Whether Help tab is enabled */
  enableHelpTab?: boolean;
  /** Whether News tab is enabled */
  enableNewsTab?: boolean;
}

/**
 * Bottom navigation component for widget views.
 * 
 * @param props - Component props
 * @returns Navigation bar with tab buttons
 */
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
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-destructive text-destructive-foreground text-[10px] font-medium rounded-full flex items-center justify-center px-1">
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
