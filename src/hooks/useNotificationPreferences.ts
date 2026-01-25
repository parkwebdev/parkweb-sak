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
  weekly_report_enabled: boolean;
  weekly_report_timezone: string;
  // Per-type push preferences
  push_lead_notifications: boolean;
  push_conversation_notifications: boolean;
  push_booking_notifications: boolean;
  push_team_notifications: boolean;
  push_message_notifications: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  sound_notifications: true,
  browser_notifications: false,
  weekly_report_enabled: true,
  weekly_report_timezone: 'America/New_York',
  // Per-type push preferences default to true
  push_lead_notifications: true,
  push_conversation_notifications: true,
  push_booking_notifications: true,
  push_team_notifications: true,
  push_message_notifications: true,
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
        .select('sound_notifications, browser_notifications, weekly_report_enabled, weekly_report_timezone, push_lead_notifications, push_conversation_notifications, push_booking_notifications, push_team_notifications, push_message_notifications')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching notification preferences:', error);
        return DEFAULT_PREFERENCES;
      }

      return {
        sound_notifications: data?.sound_notifications ?? true,
        browser_notifications: data?.browser_notifications ?? false,
        weekly_report_enabled: data?.weekly_report_enabled ?? true,
        weekly_report_timezone: data?.weekly_report_timezone ?? 'America/New_York',
        // Per-type push preferences (default to true)
        push_lead_notifications: data?.push_lead_notifications ?? true,
        push_conversation_notifications: data?.push_conversation_notifications ?? true,
        push_booking_notifications: data?.push_booking_notifications ?? true,
        push_team_notifications: data?.push_team_notifications ?? true,
        push_message_notifications: data?.push_message_notifications ?? true,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return { preferences, isLoading };
}
