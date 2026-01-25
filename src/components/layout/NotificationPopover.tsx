/**
 * @fileoverview Notification Popover Content
 * Displays list of notifications with categorization, actions, swipe-to-delete, and empty state.
 */

import { useState, useRef, useCallback } from 'react';
import { formatShortTime } from '@/lib/time-formatting';
import { 
  MessageChatSquare, 
  User01, 
  Users01, 
  FileCheck02, 
  InfoCircle,
  Check,
  Trash01
} from '@untitledui/icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserNotifications, type Notification, type NotificationType } from '@/hooks/useUserNotifications';

/** Icon and color mapping for notification types */
const notificationTypeConfig: Record<NotificationType, { icon: typeof MessageChatSquare; color: string; bgColor: string }> = {
  conversation: { 
    icon: MessageChatSquare, 
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30'
  },
  lead: { 
    icon: User01, 
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  },
  team: { 
    icon: Users01, 
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30'
  },
  report: { 
    icon: FileCheck02, 
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30'
  },
  system: { 
    icon: InfoCircle, 
    color: 'text-muted-foreground',
    bgColor: 'bg-muted'
  },
};

/** Get unread dot color based on notification type */
function getUnreadDotColor(type: NotificationType): string {
  const colors: Record<NotificationType, string> = {
    conversation: '#2563eb', // blue-600
    lead: '#16a34a', // green-600
    team: '#9333ea', // purple-600
    report: '#d97706', // amber-600
    system: '#6b7280', // gray-500
  };
  return colors[type] || colors.system;
}

/** Swipe threshold in pixels */
const SWIPE_THRESHOLD = 80;
const DELETE_THRESHOLD = 120;

/** Single notification item with swipe-to-delete */
function NotificationItem({ 
  notification, 
  onNavigate,
  onDelete,
}: { 
  notification: Notification; 
  onNavigate: (notification: Notification) => void;
  onDelete: (id: string) => void;
}) {
  const config = notificationTypeConfig[notification.type] || notificationTypeConfig.system;
  const Icon = config.icon;
  const timeAgo = formatShortTime(new Date(notification.created_at));

  // Swipe state
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setIsSwiping(false);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = touchStartRef.current.x - touch.clientX;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    // Only allow horizontal swipe if horizontal movement is greater than vertical
    if (deltaY > 10 && !isSwiping) {
      touchStartRef.current = null;
      return;
    }

    // Only swipe left (positive deltaX means swipe left)
    if (deltaX > 10) {
      setIsSwiping(true);
      setSwipeX(Math.min(Math.max(deltaX, 0), DELETE_THRESHOLD));
    }
  }, [isSwiping]);

  const handleTouchEnd = useCallback(() => {
    if (swipeX > DELETE_THRESHOLD - 10) {
      // Animate out and delete
      setSwipeX(300);
      setTimeout(() => {
        onDelete(notification.id);
      }, 200);
    } else {
      // Snap back
      setSwipeX(0);
    }
    touchStartRef.current = null;
    setIsSwiping(false);
  }, [swipeX, notification.id, onDelete]);

  const handleClick = useCallback(() => {
    if (!isSwiping && swipeX === 0) {
      onNavigate(notification);
    }
  }, [isSwiping, swipeX, notification, onNavigate]);

  const showDeleteHint = swipeX > SWIPE_THRESHOLD;

  return (
    <div className="relative overflow-hidden">
      {/* Delete background */}
      <div 
        className={cn(
          "absolute inset-y-0 right-0 flex items-center justify-end pr-4 transition-colors",
          showDeleteHint ? "bg-destructive" : "bg-destructive/50"
        )}
        style={{ width: Math.max(swipeX, 0) }}
      >
        <Trash01 
          size={20} 
          className={cn(
            "text-destructive-foreground transition-opacity",
            showDeleteHint ? "opacity-100" : "opacity-50"
          )} 
          aria-hidden="true" 
        />
      </div>

      {/* Main content */}
      <div
        ref={itemRef}
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onNavigate(notification);
          }
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "flex items-start gap-3 p-3 cursor-pointer transition-all bg-background",
          "hover:bg-accent focus:bg-accent focus:outline-none",
          !notification.read && "bg-muted/50",
          isSwiping && "transition-none"
        )}
        style={{
          transform: `translateX(-${swipeX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {/* Icon */}
        <div className={cn("p-2 rounded-lg shrink-0", config.bgColor)}>
          <Icon size={16} className={config.color} aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className={cn(
              "text-sm leading-tight line-clamp-1",
              !notification.read && "font-medium"
            )}>
              {notification.title}
            </p>
            {/* Unread indicator - colored by type */}
            {!notification.read && (
              <div 
                className={cn("h-2 w-2 rounded-full shrink-0 mt-1.5", config.bgColor.replace('bg-', 'bg-').replace('/30', ''))}
                style={{ backgroundColor: getUnreadDotColor(notification.type) }}
                aria-label="Unread"
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
          <p className="text-2xs text-muted-foreground">
            {timeAgo}
          </p>
        </div>

        {/* Delete button (desktop hover) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          className={cn(
            "p-1 rounded opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity",
            "hover:bg-destructive/10 text-muted-foreground hover:text-destructive",
            "focus:outline-none focus-visible:ring-1 focus-visible:ring-destructive",
            "hidden sm:block group-hover:opacity-100"
          )}
          aria-label="Delete notification"
        >
          <Trash01 size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/** Loading skeleton */
function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3">
      <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-2 w-16" />
      </div>
    </div>
  );
}

/** Empty state */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="p-3 rounded-full bg-muted mb-3">
        <Bell01Icon size={24} className="text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">No notifications</p>
      <p className="text-xs text-muted-foreground mt-1">
        You're all caught up!
      </p>
    </div>
  );
}

// Separate icon component to avoid import issues
function Bell01Icon({ size, className }: { size: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

interface NotificationPopoverProps {
  /** Callback to close the popover */
  onClose?: () => void;
}

/**
 * Notification popover content with header, list, swipe-to-delete, and actions.
 */
export function NotificationPopover({ onClose }: NotificationPopoverProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAllAsRead,
    deleteNotification,
    navigateToNotification,
    isMarkingAllAsRead,
  } = useUserNotifications();

  /** Navigate to notification and close popover */
  const handleNavigate = (notification: Notification) => {
    onClose?.();
    navigateToNotification(notification);
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">Notifications</h3>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllAsRead()}
            disabled={isMarkingAllAsRead}
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
          >
            <Check size={14} className="mr-1" aria-hidden="true" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Mobile swipe hint */}
      <div className="sm:hidden px-4 py-1.5 text-2xs text-muted-foreground bg-muted/30 border-b border-border">
        Swipe left to delete
      </div>

      {/* Notification list - scrollable container */}
      <div className="overflow-y-auto max-h-[360px]">
        {isLoading ? (
          <div>
            <NotificationSkeleton />
            <NotificationSkeleton />
            <NotificationSkeleton />
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onNavigate={handleNavigate}
                onDelete={deleteNotification}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer - view all link (optional) */}
      {notifications.length > 0 && (
        <div className="px-4 py-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground hover:text-foreground"
            onClick={() => handleNavigate({ 
              id: '', 
              user_id: '', 
              type: 'system', 
              title: '', 
              message: '', 
              data: { actionUrl: '/settings?tab=notifications' }, 
              read: true, 
              created_at: '', 
              updated_at: '' 
            })}
          >
            Notification settings
          </Button>
        </div>
      )}
    </div>
  );
}
