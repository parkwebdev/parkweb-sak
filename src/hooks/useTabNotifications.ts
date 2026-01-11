/**
 * useTabNotifications Hook
 * 
 * Manages browser tab notifications including:
 * - Title flashing for new messages
 * - Unread count in title
 * - Favicon badge with count
 * - Automatic clearing when tab gains focus
 * 
 * @module hooks/useTabNotifications
 * 
 * @example
 * ```tsx
 * const { 
 *   flashTitle, 
 *   setUnreadCount,
 *   setBadgeCount,
 *   isTabFocused 
 * } = useTabNotifications();
 * 
 * // When new message arrives
 * if (!isTabFocused()) {
 *   flashTitle('🔔 New Message!');
 *   setBadgeCount(unreadCount);
 * }
 * ```
 */

import { useEffect, useRef, useCallback } from 'react';
import {
  initTabNotifications,
  isTabFocused as checkTabFocused,
  setUnreadTitle,
  flashTitle as flashTitleUtil,
  stopFlashTitle,
  clearTitleNotification,
  setFaviconBadge,
  clearFaviconBadge,
  clearAllTabNotifications,
} from '@/lib/tab-notifications';

export interface UseTabNotificationsReturn {
  /** Flash the title with a message */
  flashTitle: (message: string) => void;
  /** Set unread count in title (e.g., "(3) Page Title") */
  setUnreadCount: (count: number) => void;
  /** Set badge count on favicon */
  setBadgeCount: (count: number) => void;
  /** Clear all tab notifications */
  clearNotifications: () => void;
  /** Check if tab is currently focused */
  isTabFocused: () => boolean;
}

/**
 * Hook for managing browser tab notifications
 */
export function useTabNotifications(): UseTabNotificationsReturn {
  const initializedRef = useRef(false);

  // Initialize on first mount
  useEffect(() => {
    if (!initializedRef.current) {
      initTabNotifications();
      initializedRef.current = true;
    }
  }, []);

  // Clear notifications when tab gains focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        stopFlashTitle();
        // Don't clear badge/title count automatically - let the caller decide
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTabNotifications();
    };
  }, []);

  const flashTitle = useCallback((message: string) => {
    if (!checkTabFocused()) {
      flashTitleUtil(message);
    }
  }, []);

  const setUnreadCount = useCallback((count: number) => {
    setUnreadTitle(count);
  }, []);

  const setBadgeCount = useCallback((count: number) => {
    setFaviconBadge(count);
  }, []);

  const clearNotifications = useCallback(() => {
    clearAllTabNotifications();
  }, []);

  const isTabFocused = useCallback(() => {
    return checkTabFocused();
  }, []);

  return {
    flashTitle,
    setUnreadCount,
    setBadgeCount,
    clearNotifications,
    isTabFocused,
  };
}
