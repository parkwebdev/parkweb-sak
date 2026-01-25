/**
 * Push Notification Helper
 * Dispatches push notifications to users via the send-push-notification edge function.
 * This is a fire-and-forget operation - failures are logged but don't block the calling function.
 * 
 * Supports per-type preferences: lead, conversation, booking, team, message
 */

// Define notification types for granular preferences
export type PushNotificationType = 'lead' | 'conversation' | 'booking' | 'team' | 'message';

interface PushNotificationPayload {
  user_id: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

// Type for the preferences we need to check
interface PushPreferences {
  background_push_enabled?: boolean;
  push_lead_notifications?: boolean;
  push_conversation_notifications?: boolean;
  push_booking_notifications?: boolean;
  push_team_notifications?: boolean;
  push_message_notifications?: boolean;
}

// Map notification type to the corresponding preference column
const TYPE_TO_COLUMN: Record<PushNotificationType, keyof PushPreferences> = {
  lead: 'push_lead_notifications',
  conversation: 'push_conversation_notifications',
  booking: 'push_booking_notifications',
  team: 'push_team_notifications',
  message: 'push_message_notifications',
};

/**
 * Check if user has background push notifications enabled for a specific type
 */
export async function isPushEnabled(
  supabase: { from: (table: string) => { select: (columns: string) => { eq: (column: string, value: string) => { single: () => Promise<{ data: PushPreferences | null; error: unknown }> } } } },
  userId: string,
  notificationType?: PushNotificationType
): Promise<boolean> {
  try {
    // Build select columns based on whether we need type-specific check
    const typeColumn = notificationType ? TYPE_TO_COLUMN[notificationType] : null;
    const selectColumns = typeColumn 
      ? `background_push_enabled, ${typeColumn}` 
      : 'background_push_enabled';
    
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select(selectColumns)
      .eq('user_id', userId)
      .single();
    
    // Check global toggle is enabled
    const globalEnabled = prefs?.background_push_enabled === true;
    
    // If no specific type, just return global status
    if (!typeColumn) {
      return globalEnabled;
    }
    
    // Check type-specific toggle (defaults to true if not set)
    const typeEnabled = prefs?.[typeColumn] !== false;
    
    return globalEnabled && typeEnabled;
  } catch {
    // Default to false if we can't check
    return false;
  }
}

/**
 * Dispatch a push notification to a user
 * This is non-blocking and will not throw errors
 */
export async function dispatchPushNotification(
  supabaseUrl: string,
  payload: PushNotificationPayload
): Promise<void> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (response.ok) {
      console.log(`Push notification dispatched to user ${payload.user_id}: ${payload.title}`);
    } else {
      const errorText = await response.text();
      console.error('Push notification dispatch failed:', errorText);
    }
  } catch (error: unknown) {
    console.error('Push notification dispatch error (non-critical):', error);
  }
}

/**
 * Check user preferences and dispatch push notification if enabled
 * Convenience wrapper that combines the preference check and dispatch
 * 
 * @param supabase - Supabase client
 * @param supabaseUrl - Supabase project URL for edge function calls
 * @param payload - Notification payload (user_id, title, body, url, tag)
 * @param notificationType - Optional type for granular preference checking
 */
export async function dispatchPushIfEnabled(
  supabase: { from: (table: string) => { select: (columns: string) => { eq: (column: string, value: string) => { single: () => Promise<{ data: PushPreferences | null; error: unknown }> } } } },
  supabaseUrl: string,
  payload: PushNotificationPayload,
  notificationType?: PushNotificationType
): Promise<void> {
  const enabled = await isPushEnabled(supabase, payload.user_id, notificationType);
  
  if (enabled) {
    await dispatchPushNotification(supabaseUrl, payload);
  } else {
    const typeInfo = notificationType ? ` (type: ${notificationType})` : '';
    console.log(`Push notifications disabled for user ${payload.user_id}${typeInfo}, skipping`);
  }
}
