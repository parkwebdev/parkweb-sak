/**
 * Push Notification Helper
 * Dispatches push notifications to users via the send-push-notification edge function.
 * This is a fire-and-forget operation - failures are logged but don't block the calling function.
 */

interface PushNotificationPayload {
  user_id: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

/**
 * Check if user has background push notifications enabled
 */
export async function isPushEnabled(
  supabase: { from: (table: string) => { select: (columns: string) => { eq: (column: string, value: string) => { single: () => Promise<{ data: { background_push_enabled?: boolean } | null; error: unknown }> } } } },
  userId: string
): Promise<boolean> {
  try {
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('background_push_enabled')
      .eq('user_id', userId)
      .single();
    
    return prefs?.background_push_enabled === true;
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
 */
export async function dispatchPushIfEnabled(
  supabase: { from: (table: string) => { select: (columns: string) => { eq: (column: string, value: string) => { single: () => Promise<{ data: { background_push_enabled?: boolean } | null; error: unknown }> } } } },
  supabaseUrl: string,
  payload: PushNotificationPayload
): Promise<void> {
  const enabled = await isPushEnabled(supabase, payload.user_id);
  
  if (enabled) {
    await dispatchPushNotification(supabaseUrl, payload);
  } else {
    console.log(`Push notifications disabled for user ${payload.user_id}, skipping`);
  }
}
