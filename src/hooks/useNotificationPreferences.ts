/**
 * Notification Preferences Hook
 * 
 * Fetches user notification preferences for sound and browser notifications.
 * Used to respect user settings when delivering real-time notifications.
 * 
 * @module hooks/useNotificationPreferences
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/query-keys';

export interface NotificationPreferences {
  sound_notifications: boolean;
  browser_notifications: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  sound_notifications: true,
  browser_notifications: false,
};

/**
 * Hook to fetch user notification preferences.
 * Returns sound and browser notification settings.
 */
export function useNotificationPreferences() {
  const { user } = useAuth();

  const { data: preferences = DEFAULT_PREFERENCES, isLoading } = useQuery({
    queryKey: queryKeys.notifications.preferences(user?.id || ''),
    queryFn: async (): Promise<NotificationPreferences> => {
      if (!user?.id) return DEFAULT_PREFERENCES;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('sound_notifications, browser_notifications')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching notification preferences:', error);
        return DEFAULT_PREFERENCES;
      }

      return {
        sound_notifications: data?.sound_notifications ?? true,
        browser_notifications: data?.browser_notifications ?? false,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return { preferences, isLoading };
}
