/**
 * @fileoverview Notification Bell Component
 * Bell icon with unread count badge for the TopBar.
 * Opens NotificationPopover on click.
 */

import { Bell01 } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NotificationPopover } from './NotificationPopover';
import { useUserNotifications } from '@/hooks/useUserNotifications';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Notification bell button with unread count badge.
 * Positioned in TopBar next to user avatar.
 */
export function NotificationBell() {
  const { unreadCount, isLoading } = useUserNotifications();
  const prefersReducedMotion = useReducedMotion();

  // Format count for display (99+ for large numbers)
  const displayCount = unreadCount > 99 ? '99+' : unreadCount;
  const hasUnread = unreadCount > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "relative flex items-center justify-center h-8 w-8 rounded-md",
            "text-muted-foreground hover:text-foreground hover:bg-accent",
            "transition-colors duration-150",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
          aria-label={`Notifications${hasUnread ? `, ${unreadCount} unread` : ''}`}
        >
          <Bell01 
            size={20} 
            aria-hidden="true"
            className={cn(
              hasUnread && !prefersReducedMotion && "animate-bell-ring"
            )}
          />
          
          {/* Unread count badge */}
          {hasUnread && !isLoading && (
            <Badge
              variant="destructive"
              size={unreadCount > 9 ? 'micro' : 'dot'}
              className={cn(
                "absolute -top-0.5 -right-0.5 min-w-[18px]",
                "border-2 border-background",
                unreadCount <= 9 && "h-[18px] w-[18px]"
              )}
              role="status"
              aria-live="polite"
            >
              {displayCount}
            </Badge>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={8}
        className="w-80 p-0 rounded-xl shadow-lg"
      >
        <NotificationPopover />
      </PopoverContent>
    </Popover>
  );
}
