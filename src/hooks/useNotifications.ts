import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateNotificationParams {
  type: 'scope_work' | 'onboarding' | 'system' | 'team';
  title: string;
  message: string;
  data?: any;
  userId?: string; // Optional - will use current user if not provided
}

export const useNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();

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
        console.error('No user ID provided for notification');
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
        console.error('Error creating notification:', error);
        return { error };
      }

      return { data: notification, error: null };
    } catch (error) {
      console.error('Error in createNotification:', error);
      return { error };
    }
  };

  const createScopeWorkNotification = async (
    title: string,
    message: string,
    sowData?: any,
    userId?: string
  ) => {
    return createNotification({
      type: 'scope_work',
      title,
      message,
      data: sowData,
      userId
    });
  };

  const createOnboardingNotification = async (
    title: string,
    message: string,
    onboardingData?: any,
    userId?: string
  ) => {
    return createNotification({
      type: 'onboarding',
      title,
      message,
      data: onboardingData,
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
        toast({
          title: "Notifications enabled",
          description: "You'll receive browser notifications for important updates.",
        });
      } else if (permission === 'denied') {
        toast({
          title: "Notifications blocked",
          description: "Please enable notifications in your browser settings to receive updates.",
          variant: "destructive",
        });
      }
      
      return permission;
    }
    
    return 'unsupported';
  };

  return {
    createNotification,
    createScopeWorkNotification,
    createOnboardingNotification,
    createSystemNotification,
    createTeamNotification,
    requestBrowserNotificationPermission,
  };
};