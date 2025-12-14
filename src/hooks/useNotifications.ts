import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';

interface CreateNotificationParams {
  type: 'conversation' | 'lead' | 'team' | 'report' | 'system';
  title: string;
  message: string;
  data?: any;
  userId?: string; // Optional - will use current user if not provided
}

/**
 * Hook for creating in-app notifications.
 * Provides type-specific notification creators and browser notification support.
 * 
 * @returns {Object} Notification creation methods
 * @returns {Function} createNotification - Generic notification creator
 * @returns {Function} createConversationNotification - Conversation-related notification
 * @returns {Function} createLeadNotification - Lead-related notification
 * @returns {Function} createReportNotification - Report-related notification
 * @returns {Function} createSystemNotification - System-related notification
 * @returns {Function} createTeamNotification - Team-related notification
 * @returns {Function} requestBrowserNotificationPermission - Request browser notification permission
 */
export const useNotifications = () => {
  const { user } = useAuth();

  const createNotification = async ({
    type,
    title,
    message,
    data = null,
    userId
  }: CreateNotificationParams) => {
    try {
      const targetUserId = userId || user?.id;
      
      if (!targetUserId) {
        logger.error('No user ID provided for notification');
        return { error: 'No user ID available' };
      }

      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          user_id: targetUserId,
          type,
          title,
          message,
          data,
          read: false
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating notification:', error);
        return { error };
      }

      return { data: notification, error: null };
    } catch (error) {
      logger.error('Error in createNotification:', error);
      return { error };
    }
  };

  const createConversationNotification = async (
    title: string,
    message: string,
    conversationData?: any,
    userId?: string
  ) => {
    return createNotification({
      type: 'conversation',
      title,
      message,
      data: conversationData,
      userId
    });
  };

  const createLeadNotification = async (
    title: string,
    message: string,
    leadData?: any,
    userId?: string
  ) => {
    return createNotification({
      type: 'lead',
      title,
      message,
      data: leadData,
      userId
    });
  };

  const createReportNotification = async (
    title: string,
    message: string,
    reportData?: any,
    userId?: string
  ) => {
    return createNotification({
      type: 'report',
      title,
      message,
      data: reportData,
      userId
    });
  };

  const createSystemNotification = async (
    title: string,
    message: string,
    systemData?: any,
    userId?: string
  ) => {
    return createNotification({
      type: 'system',
      title,
      message,
      data: systemData,
      userId
    });
  };

  const createTeamNotification = async (
    title: string,
    message: string,
    teamData?: any,
    userId?: string
  ) => {
    return createNotification({
      type: 'team',
      title,
      message,
      data: teamData,
      userId
    });
  };

  const requestBrowserNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        toast.success("Notifications enabled", {
          description: "You'll receive browser notifications for important updates.",
        });
      } else if (permission === 'denied') {
        toast.error("Notifications blocked", {
          description: "Please enable notifications in your browser settings to receive updates.",
        });
      }
      
      return permission;
    }
    
    return 'unsupported';
  };

  return {
    createNotification,
    createConversationNotification,
    createLeadNotification,
    createReportNotification,
    createSystemNotification,
    createTeamNotification,
    requestBrowserNotificationPermission,
  };
};