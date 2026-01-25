/**
 * Browser Push Notifications Utility
 * 
 * Handles browser notification delivery when tab is not focused.
 * Includes permission checking and graceful fallbacks.
 * 
 * @module lib/browser-notifications
 */

import type { Notification as AppNotification } from '@/hooks/useUserNotifications';

/**
 * Notification icon path with cache-busting version.
 * Used by both production notifications and test notifications.
 */
export const NOTIFICATION_ICON_PATH = '/notification-icon.png?v=2';

/**
 * Badge icon for notification status bar (monochrome recommended).
 * Some platforms use this for a smaller status indicator.
 */
export const NOTIFICATION_BADGE_PATH = '/notification-icon.png?v=2';

/**
 * Check if browser notifications are supported and permitted.
 */
export function canShowBrowserNotification(): boolean {
  if (!('Notification' in window)) {
    return false;
  }
  return Notification.permission === 'granted';
}

/**
 * Check if the tab is currently focused.
 */
export function isTabFocused(): boolean {
  return document.visibilityState === 'visible' && document.hasFocus();
}

/**
 * Show a browser notification for a new app notification.
 * Only shows if tab is not focused and permissions are granted.
 * 
 * @param notification - The notification to display
 * @returns True if notification was shown, false otherwise
 */
export function showBrowserNotification(notification: AppNotification): boolean {
  // Only show if tab is not focused
  if (isTabFocused()) {
    return false;
  }

  // Check if we can show notifications
  if (!canShowBrowserNotification()) {
    return false;
  }

  try {
    const tag = `notification-${notification.id}`;

    const browserNotification = new Notification(notification.title, {
      body: notification.message,
      icon: NOTIFICATION_ICON_PATH,
      badge: NOTIFICATION_BADGE_PATH,
      tag, // Prevents duplicate notifications
      requireInteraction: false,
      silent: true, // We handle sound separately
    });

    // Auto-close after 5 seconds
    setTimeout(() => {
      browserNotification.close();
    }, 5000);

    // Handle click to focus the app
    browserNotification.onclick = () => {
      window.focus();
      browserNotification.close();
    };

    return true;
  } catch (error: unknown) {
    console.error('Failed to show browser notification:', error);
    return false;
  }
}
