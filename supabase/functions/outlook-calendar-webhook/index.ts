/**
 * Outlook Calendar Webhook Handler
 * 
 * Receives change notifications from Microsoft Graph API when calendar events change.
 * Updates local calendar_events table to reflect external changes.
 * 
 * @module outlook-calendar-webhook
 * @verified Phase 3.1 Complete - December 2025
 * 
 * Microsoft Graph Subscription Flow:
 * 1. Initial POST with validationToken query param - must echo it back
 * 2. Subsequent POSTs contain change notifications in body
 * 
 * Notification Body Structure:
 * {
 *   value: [{
 *     subscriptionId: string,
 *     clientState: string (our secret),
 *     changeType: 'created' | 'updated' | 'deleted',
 *     resource: string (e.g., "me/events/{id}"),
 *     resourceData: { id: string, ... }
 *   }]
 * }
 * 
 * TODO: Add CALENDAR_WEBHOOK_SECRET to Supabase secrets
 * TODO: Add MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET for token refresh
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// TODO: Add these secrets via Lovable secrets management
const WEBHOOK_SECRET = Deno.env.get('CALENDAR_WEBHOOK_SECRET') || '';
const MICROSOFT_CLIENT_ID = Deno.env.get('MICROSOFT_CLIENT_ID') || '';
const MICROSOFT_CLIENT_SECRET = Deno.env.get('MICROSOFT_CLIENT_SECRET') || '';

const SCOPES = [
  'openid',
  'email',
  'offline_access',
  'Calendars.Read',
  'Calendars.ReadWrite',
].join(' ');

interface OutlookNotification {
  subscriptionId: string;
  clientState?: string;
  changeType: 'created' | 'updated' | 'deleted';
  resource: string;
  resourceData?: {
    id: string;
    '@odata.type'?: string;
    '@odata.id'?: string;
    '@odata.etag'?: string;
  };
}

interface OutlookEvent {
  id: string;
  subject?: string;
  body?: { content: string; contentType: string };
  start?: { dateTime: string; timeZone: string };
  end?: { dateTime: string; timeZone: string };
  isCancelled?: boolean;
  showAs?: 'free' | 'tentative' | 'busy' | 'oof' | 'workingElsewhere' | 'unknown';
  responseStatus?: { response: 'none' | 'organizer' | 'tentativelyAccepted' | 'accepted' | 'declined' | 'notResponded' };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  try {
    // Handle Microsoft subscription validation (Step 1 of subscription lifecycle)
    // Microsoft sends GET request with validationToken query param
    const validationToken = url.searchParams.get('validationToken');
    if (validationToken) {
      console.log('[outlook-calendar-webhook] Validation request received');
      // Must return the token as plain text with 200 status
      return new Response(validationToken, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Handle actual notifications (POST requests)
    if (req.method !== 'POST') {
      console.log('[outlook-calendar-webhook] Received non-POST request without validationToken, ignoring');
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse notification body
    const body = await req.json();
    const notifications: OutlookNotification[] = body.value || [];

    console.log(`[outlook-calendar-webhook] Received ${notifications.length} notifications`);

    for (const notification of notifications) {
      // Validate client state (our webhook secret) if configured
      if (WEBHOOK_SECRET && notification.clientState !== WEBHOOK_SECRET) {
        console.error('[outlook-calendar-webhook] Invalid clientState for subscription:', notification.subscriptionId);
        continue;
      }

      console.log(`[outlook-calendar-webhook] Processing: ${notification.changeType} - ${notification.resource}`);

      // Find the connected account by subscription ID (stored in webhook_channel_id)
      const { data: account, error: accountError } = await supabase
        .from('connected_accounts')
        .select('*')
        .eq('webhook_channel_id', notification.subscriptionId)
        .single();

      if (accountError || !account) {
        console.error('[outlook-calendar-webhook] Account not found for subscription:', notification.subscriptionId);
        continue;
      }

      // Check if token needs refresh
      let accessToken = account.access_token;
      if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
        console.log('[outlook-calendar-webhook] Token expired, refreshing...');
        accessToken = await refreshAccessToken(supabase, account);
        if (!accessToken) {
          console.error('[outlook-calendar-webhook] Failed to refresh token for account:', account.id);
          continue;
        }
      }

      // Process the notification based on change type
      await processNotification(supabase, account, notification, accessToken);

      // Update last_synced_at
      await supabase
        .from('connected_accounts')
        .update({ 
          last_synced_at: new Date().toISOString(),
          sync_error: null 
        })
        .eq('id', account.id);
    }

    // Microsoft requires 202 Accepted for successful notification processing
    return new Response(null, { status: 202, headers: corsHeaders });

  } catch (error: unknown) {
    console.error('[outlook-calendar-webhook] Unexpected error:', error);
    // Return 202 to prevent Microsoft from retrying on our errors
    return new Response(null, { status: 202, headers: corsHeaders });
  }
});

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(
  supabase: ReturnType<typeof createClient>,
  account: { id: string; refresh_token: string | null }
): Promise<string | null> {
  if (!account.refresh_token || !MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET) {
    return null;
  }

  try {
    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: MICROSOFT_CLIENT_ID,
        client_secret: MICROSOFT_CLIENT_SECRET,
        refresh_token: account.refresh_token,
        grant_type: 'refresh_token',
        scope: SCOPES,
      }),
    });

    if (!response.ok) {
      console.error('[outlook-calendar-webhook] Token refresh failed:', await response.text());
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
        refresh_token: tokens.refresh_token || account.refresh_token,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      })
      .eq('id', account.id);

    return tokens.access_token;
  } catch (error) {
    console.error('[outlook-calendar-webhook] Token refresh error:', error);
    return null;
  }
}

/**
 * Process a single notification from Microsoft Graph
 */
async function processNotification(
  supabase: ReturnType<typeof createClient>,
  account: { id: string },
  notification: OutlookNotification,
  accessToken: string
): Promise<void> {
  const eventId = notification.resourceData?.id;
  
  if (!eventId) {
    console.log('[outlook-calendar-webhook] No event ID in notification, fetching from resource');
    // Try to extract from resource path (e.g., "me/events/{id}")
    const match = notification.resource.match(/events\/([^/]+)/);
    if (!match) {
      console.error('[outlook-calendar-webhook] Could not extract event ID from resource:', notification.resource);
      return;
    }
  }

  // Find existing event in our database
  const externalEventId = eventId || notification.resource.split('/').pop();
  
  const { data: existingEvent } = await supabase
    .from('calendar_events')
    .select('id, status')
    .eq('connected_account_id', account.id)
    .eq('external_event_id', externalEventId)
    .single();

  if (!existingEvent) {
    // Event not in our system - likely created outside widget booking
    console.log(`[outlook-calendar-webhook] Event ${externalEventId} not in our system, skipping`);
    return;
  }

  // Handle different change types
  switch (notification.changeType) {
    case 'deleted':
      console.log(`[outlook-calendar-webhook] Event ${externalEventId} deleted, marking as cancelled`);
      await supabase
        .from('calendar_events')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingEvent.id);
      break;

    case 'created':
    case 'updated':
      // Fetch the event details from Microsoft Graph
      await syncEventFromGraph(supabase, account.id, existingEvent, externalEventId!, accessToken);
      break;
  }
}

/**
 * Sync event details from Microsoft Graph API
 */
async function syncEventFromGraph(
  supabase: ReturnType<typeof createClient>,
  accountId: string,
  existingEvent: { id: string; status: string },
  externalEventId: string,
  accessToken: string
): Promise<void> {
  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/events/${externalEventId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        // Event was deleted
        console.log(`[outlook-calendar-webhook] Event ${externalEventId} not found (deleted)`);
        await supabase
          .from('calendar_events')
          .update({ 
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingEvent.id);
      } else {
        console.error('[outlook-calendar-webhook] Failed to fetch event:', await response.text());
      }
      return;
    }

    const event: OutlookEvent = await response.json();
    
    // Determine status based on event properties
    let newStatus: string | null = null;
    
    if (event.isCancelled) {
      newStatus = 'cancelled';
    } else if (event.responseStatus?.response === 'declined') {
      newStatus = 'cancelled';
    } else {
      // Check if event is in the past - auto-complete
      const endTime = event.end?.dateTime;
      if (endTime && new Date(endTime) < new Date()) {
        // Only auto-complete if not already cancelled
        if (existingEvent.status !== 'cancelled' && existingEvent.status !== 'no_show') {
          newStatus = 'completed';
        }
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (newStatus && newStatus !== existingEvent.status) {
      console.log(`[outlook-calendar-webhook] Updating event ${externalEventId}: ${existingEvent.status} -> ${newStatus}`);
      updateData.status = newStatus;
    }

    // Update times if changed
    if (event.start?.dateTime) {
      updateData.start_time = event.start.dateTime;
    }
    if (event.end?.dateTime) {
      updateData.end_time = event.end.dateTime;
    }
    if (event.subject) {
      updateData.title = event.subject;
    }

    await supabase
      .from('calendar_events')
      .update(updateData)
      .eq('id', existingEvent.id);

  } catch (error) {
    console.error('[outlook-calendar-webhook] Error syncing event from Graph:', error);
  }
}
