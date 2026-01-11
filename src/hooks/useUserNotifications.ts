/**
 * User Notifications Hook
 * 
 * Fetches, manages, and subscribes to real-time notifications for the current user.
 * Provides unread count, mark as read, and navigation helpers.
 * Includes sound and browser push notification support.
 * 
 * @module hooks/useUserNotifications
 */

import { useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/query-keys';
import { RealtimeManager } from '@/lib/realtime-manager';
import { logger } from '@/utils/logger';
import { getErrorMessage } from '@/types/errors';
import { playNotificationSound } from '@/lib/notification-sound';
import { showBrowserNotification } from '@/lib/browser-notifications';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import type { Json } from '@/integrations/supabase/types';
import type { NotificationData } from '@/hooks/useNotifications';

/** Notification type from database */
export type NotificationType = 'conversation' | 'lead' | 'team' | 'report' | 'system';

/** Notification record from database */
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Json | null;
  read: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Hook for reading and managing user notifications.
 * 
 * @returns {Object} Notification state and actions
 * @returns {Notification[]} notifications - List of notifications
 * @returns {number} unreadCount - Count of unread notifications
 * @returns {boolean} isLoading - Loading state
 * @returns {Function} markAsRead - Mark single notification as read
 * @returns {Function} markAllAsRead - Mark all notifications as read
 * @returns {Function} deleteNotification - Delete a notification
 * @returns {Function} navigateToNotification - Navigate based on notification type
 */
export function useUserNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { preferences } = useNotificationPreferences();
  
  // Track previous notification IDs to detect new ones
  const previousNotificationIdsRef = useRef<Set<string>>(new Set());

  // Fetch all notifications for user
  const {
    data: notifications = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.notifications.list(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        logger.error('Error fetching notifications:', error);
        throw error;
      }

      return (data || []) as Notification[];
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Mark single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.list(user?.id || ''),
      });
    },
    onError: (error: unknown) => {
      logger.error('Error marking notification as read:', getErrorMessage(error));
    },
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.list(user?.id || ''),
      });
    },
    onError: (error: unknown) => {
      logger.error('Error marking all notifications as read:', getErrorMessage(error));
    },
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.list(user?.id || ''),
      });
    },
    onError: (error: unknown) => {
      logger.error('Error deleting notification:', getErrorMessage(error));
    },
  });

  // Navigate to notification target
  const navigateToNotification = useCallback(
    (notification: Notification) => {
      const data = notification.data as NotificationData | null;

      // Mark as read on click
      if (!notification.read) {
        markAsReadMutation.mutate(notification.id);
      }

      switch (notification.type) {
        case 'conversation':
          if (data && 'conversationId' in data && data.conversationId) {
            navigate(`/inbox/${data.conversationId}`);
          } else {
            navigate('/inbox');
          }
          break;
        case 'lead':
          if (data && 'leadId' in data && data.leadId) {
            navigate(`/leads/${data.leadId}`);
          } else {
            navigate('/leads');
          }
          break;
        case 'team':
          navigate('/settings?tab=team');
          break;
        case 'report':
          navigate('/analytics?tab=reports');
          break;
        case 'system':
          if (data && 'actionUrl' in data && typeof data.actionUrl === 'string') {
            // Handle external URLs or internal routes
            if (data.actionUrl.startsWith('http')) {
              window.open(data.actionUrl, '_blank');
            } else {
              navigate(data.actionUrl);
            }
          } else {
            navigate('/settings');
          }
          break;
        default:
          navigate('/');
      }
    },
    [navigate, markAsReadMutation]
  );

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = RealtimeManager.subscribe(
      {
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
        event: 'INSERT',
      },
      (payload) => {
        // Handle new notification
        const newNotification = payload.new as Notification | undefined;
        
        if (newNotification && !previousNotificationIdsRef.current.has(newNotification.id)) {
          // Play sound if enabled
          if (preferences.sound_notifications) {
            playNotificationSound();
          }
          
          // Show browser notification if enabled
          if (preferences.browser_notifications) {
            showBrowserNotification(newNotification);
          }
          
          // Track this notification ID
          previousNotificationIdsRef.current.add(newNotification.id);
        }
        
        // Invalidate queries to refetch
        queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.list(user.id),
        });
      },
      user.id
    );

    return unsubscribe;
  }, [user?.id, queryClient, preferences.sound_notifications, preferences.browser_notifications]);

  // Initialize previous notification IDs from fetched data
  useEffect(() => {
    if (notifications.length > 0) {
      previousNotificationIdsRef.current = new Set(notifications.map(n => n.id));
    }
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    navigateToNotification,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  };
}
