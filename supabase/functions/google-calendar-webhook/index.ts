/**
 * Google Calendar Webhook Handler
 * 
 * Receives push notifications from Google Calendar API when events change.
 * Updates local calendar_events table to reflect external changes.
 * 
 * @module google-calendar-webhook
 * @verified Phase 2.1 Complete - December 2025
 * 
 * Google Push Notification Headers:
 * - X-Goog-Channel-ID: Our channel UUID
 * - X-Goog-Resource-ID: Google's resource identifier
 * - X-Goog-Resource-State: 'sync' | 'exists' | 'not_exists'
 * - X-Goog-Message-Number: Incremental message number
 * - X-Goog-Channel-Token: Our webhook secret for validation
 * 
 * TODO: Add CALENDAR_WEBHOOK_SECRET to Supabase secrets for token validation
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// TODO: Add this secret via Lovable secrets management
const WEBHOOK_SECRET = Deno.env.get('CALENDAR_WEBHOOK_SECRET') || '';
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') || '';
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') || '';

interface GoogleCalendarEvent {
  id: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  attendees?: Array<{ email: string; responseStatus: string }>;
  updated?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Google sends notifications as POST requests
    if (req.method !== 'POST') {
      console.log('[google-calendar-webhook] Received non-POST request, ignoring');
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract Google notification headers
    const channelId = req.headers.get('X-Goog-Channel-ID');
    const resourceId = req.headers.get('X-Goog-Resource-ID');
    const resourceState = req.headers.get('X-Goog-Resource-State');
    const messageNumber = req.headers.get('X-Goog-Message-Number');
    const channelToken = req.headers.get('X-Goog-Channel-Token');

    console.log(`[google-calendar-webhook] Received notification:`, {
      channelId,
      resourceId,
      resourceState,
      messageNumber,
    });

    // Validate webhook token if secret is configured
    if (WEBHOOK_SECRET && channelToken !== WEBHOOK_SECRET) {
      console.error('[google-calendar-webhook] Invalid channel token');
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle sync notification (initial setup confirmation)
    if (resourceState === 'sync') {
      console.log('[google-calendar-webhook] Sync notification received - subscription confirmed');
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // Find the connected account by channel ID
    if (!channelId) {
      console.error('[google-calendar-webhook] Missing channel ID');
      return new Response(null, { status: 400, headers: corsHeaders });
    }

    const { data: account, error: accountError } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('webhook_channel_id', channelId)
      .single();

    if (accountError || !account) {
      console.error('[google-calendar-webhook] Account not found for channel:', channelId);
      // Return 200 to prevent Google from retrying (account may have been deleted)
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    console.log(`[google-calendar-webhook] Found account: ${account.id} (${account.account_email})`);

    // Check if token needs refresh
    let accessToken = account.access_token;
    if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
      console.log('[google-calendar-webhook] Token expired, refreshing...');
      accessToken = await refreshAccessToken(supabase, account);
      if (!accessToken) {
        console.error('[google-calendar-webhook] Failed to refresh token');
        return new Response(null, { status: 200, headers: corsHeaders });
      }
    }

    // Handle event changes
    if (resourceState === 'exists' || resourceState === 'not_exists') {
      // Fetch recent changes from Google Calendar
      await syncRecentChanges(supabase, account, accessToken);
    }

    // Update last_synced_at
    await supabase
      .from('connected_accounts')
      .update({ 
        last_synced_at: new Date().toISOString(),
        sync_error: null 
      })
      .eq('id', account.id);

    return new Response(null, { status: 200, headers: corsHeaders });

  } catch (error: unknown) {
    console.error('[google-calendar-webhook] Unexpected error:', error);
    // Return 200 to prevent Google from retrying on our errors
    return new Response(null, { status: 200, headers: corsHeaders });
  }
});

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(
  supabase: ReturnType<typeof createClient>,
  account: { id: string; refresh_token: string | null }
): Promise<string | null> {
  if (!account.refresh_token || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return null;
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: account.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      console.error('[google-calendar-webhook] Token refresh failed:', await response.text());
      await supabase
        .from('connected_accounts')
        .update({ sync_error: 'Token refresh failed - reconnection may be required' })
        .eq('id', account.id);
      return null;
    }

    const tokens = await response.json();
    
    await supabase
      .from('connected_accounts')
      .update({
        access_token: tokens.access_token,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      })
      .eq('id', account.id);

    return tokens.access_token;
  } catch (error) {
    console.error('[google-calendar-webhook] Token refresh error:', error);
    return null;
  }
}

/**
 * Sync recent calendar changes from Google
 * Uses incremental sync with updated timestamps
 */
async function syncRecentChanges(
  supabase: ReturnType<typeof createClient>,
  account: { 
    id: string; 
    calendar_id: string | null;
    last_synced_at: string | null;
  },
  accessToken: string
): Promise<void> {
  const calendarId = account.calendar_id || 'primary';
  
  // Get events updated since last sync (or last 24 hours if never synced)
  const updatedMin = account.last_synced_at 
    ? new Date(account.last_synced_at).toISOString()
    : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
  url.searchParams.set('updatedMin', updatedMin);
  url.searchParams.set('showDeleted', 'true');
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('maxResults', '50');

  try {
    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      console.error('[google-calendar-webhook] Failed to fetch events:', await response.text());
      return;
    }

    const data = await response.json();
    const events: GoogleCalendarEvent[] = data.items || [];

    console.log(`[google-calendar-webhook] Processing ${events.length} changed events`);

    for (const event of events) {
      await processEventChange(supabase, account.id, event);
    }
  } catch (error) {
    console.error('[google-calendar-webhook] Error syncing changes:', error);
  }
}

/**
 * Process a single event change from Google Calendar
 */
async function processEventChange(
  supabase: ReturnType<typeof createClient>,
  accountId: string,
  event: GoogleCalendarEvent
): Promise<void> {
  // Find existing event in our database
  const { data: existingEvent } = await supabase
    .from('calendar_events')
    .select('id, status')
    .eq('connected_account_id', accountId)
    .eq('external_event_id', event.id)
    .single();

  if (!existingEvent) {
    // Event not in our system - likely created outside widget booking
    // We only track events created through our booking system
    console.log(`[google-calendar-webhook] Event ${event.id} not in our system, skipping`);
    return;
  }

  // Map Google status to our status
  let newStatus: string | null = null;
  
  if (event.status === 'cancelled') {
    newStatus = 'cancelled';
  } else if (event.status === 'confirmed') {
    // Check if event is in the past - auto-complete
    const endTime = event.end?.dateTime || event.end?.date;
    if (endTime && new Date(endTime) < new Date()) {
      // Only auto-complete if not already cancelled
      if (existingEvent.status !== 'cancelled' && existingEvent.status !== 'no_show') {
        newStatus = 'completed';
      }
    }
  }

  // Update event if status changed
  if (newStatus && newStatus !== existingEvent.status) {
    console.log(`[google-calendar-webhook] Updating event ${event.id}: ${existingEvent.status} -> ${newStatus}`);
    
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    // Also update times if changed
    if (event.start?.dateTime) {
      updateData.start_time = event.start.dateTime;
    }
    if (event.end?.dateTime) {
      updateData.end_time = event.end.dateTime;
    }
    if (event.summary) {
      updateData.title = event.summary;
    }

    await supabase
      .from('calendar_events')
      .update(updateData)
      .eq('id', existingEvent.id);
  }
}
