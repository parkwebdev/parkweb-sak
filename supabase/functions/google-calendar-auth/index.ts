/**
 * Google Calendar OAuth Edge Function
 * 
 * Handles OAuth 2.0 flow for Google Calendar integration.
 * Actions: initiate, callback, refresh, disconnect
 * 
 * @module google-calendar-auth
 * @verified Phase 2.2 Complete - December 2025
 * 
 * Webhook Integration:
 * - On successful callback, creates a Google Calendar push notification subscription
 * - Webhooks notify us of event changes in real-time for accurate booking analytics
 * - Webhooks expire after 7 days and are renewed by renew-calendar-webhooks scheduled function
 * 
 * TODO: Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI secrets
 * TODO: Add CALENDAR_WEBHOOK_SECRET for webhook validation
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') || '';
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') || '';
const GOOGLE_REDIRECT_URI = Deno.env.get('GOOGLE_REDIRECT_URI') || '';
const WEBHOOK_SECRET = Deno.env.get('CALENDAR_WEBHOOK_SECRET') || '';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/google-calendar-webhook`;

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth header for user context
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const { action, locationId, agentId, code, state, accountId } = await req.json();

    console.log(`[google-calendar-auth] Action: ${action}, Agent: ${agentId}, Location: ${locationId}`);

    // Validate required environment variables
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error('[google-calendar-auth] Missing Google OAuth credentials');
      return new Response(
        JSON.stringify({ 
          error: 'Google Calendar integration not configured',
          details: 'Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET secrets' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'initiate': {
        if (!agentId) {
          return new Response(
            JSON.stringify({ error: 'agentId is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create state parameter with location and agent info
        const stateData = JSON.stringify({
          provider: 'google',
          locationId: locationId || null,
          agentId,
          userId,
          timestamp: Date.now(),
        });
        const stateParam = btoa(stateData);

        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
        authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', SCOPES);
        authUrl.searchParams.set('access_type', 'offline');
        authUrl.searchParams.set('prompt', 'consent');
        authUrl.searchParams.set('state', stateParam);

        console.log(`[google-calendar-auth] Generated auth URL for agent ${agentId}`);

        return new Response(
          JSON.stringify({ authUrl: authUrl.toString() }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'callback': {
        if (!code || !state) {
          return new Response(
            JSON.stringify({ error: 'code and state are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Decode state
        let stateData;
        try {
          stateData = JSON.parse(atob(state));
        } catch {
          return new Response(
            JSON.stringify({ error: 'Invalid state parameter' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: GOOGLE_REDIRECT_URI,
          }),
        });

        if (!tokenResponse.ok) {
          const error = await tokenResponse.text();
          console.error('[google-calendar-auth] Token exchange failed:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to exchange authorization code' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const tokens = await tokenResponse.json();
        console.log('[google-calendar-auth] Token exchange successful');

        // Get user email
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        if (!userInfoResponse.ok) {
          console.error('[google-calendar-auth] Failed to get user info');
          return new Response(
            JSON.stringify({ error: 'Failed to get user information' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const userInfo = await userInfoResponse.json();
        console.log(`[google-calendar-auth] Connected account: ${userInfo.email}`);

        // Get primary calendar info
        const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        let calendarId = 'primary';
        let calendarName = 'Primary Calendar';
        if (calendarResponse.ok) {
          const calendarInfo = await calendarResponse.json();
          calendarId = calendarInfo.id;
          calendarName = calendarInfo.summary;
        }

        // Create webhook subscription for real-time sync
        let webhookChannelId: string | null = null;
        let webhookResourceId: string | null = null;
        let webhookExpiresAt: string | null = null;

        try {
          const webhookResult = await createWebhookSubscription(
            calendarId,
            tokens.access_token
          );
          if (webhookResult) {
            webhookChannelId = webhookResult.channelId;
            webhookResourceId = webhookResult.resourceId;
            webhookExpiresAt = webhookResult.expiresAt;
            console.log(`[google-calendar-auth] Webhook subscription created: ${webhookChannelId}`);
          }
        } catch (webhookError) {
          // Log but don't fail the connection - webhook can be set up later
          console.warn('[google-calendar-auth] Failed to create webhook subscription:', webhookError);
        }

        // Store in database
        const { data: account, error: insertError } = await supabase
          .from('connected_accounts')
          .insert({
            location_id: stateData.locationId,
            agent_id: stateData.agentId,
            user_id: stateData.userId,
            provider: 'google_calendar',
            account_email: userInfo.email,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
            calendar_id: calendarId,
            calendar_name: calendarName,
            is_active: true,
            webhook_channel_id: webhookChannelId,
            webhook_resource_id: webhookResourceId,
            webhook_expires_at: webhookExpiresAt,
          })
          .select()
          .single();

        if (insertError) {
          console.error('[google-calendar-auth] Database insert error:', insertError);
          return new Response(
            JSON.stringify({ error: 'Failed to save connection' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`[google-calendar-auth] Account saved: ${account.id}`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            accountId: account.id,
            webhookEnabled: !!webhookChannelId,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'refresh': {
        if (!accountId) {
          return new Response(
            JSON.stringify({ error: 'accountId is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get account from database
        const { data: account, error: fetchError } = await supabase
          .from('connected_accounts')
          .select('*')
          .eq('id', accountId)
          .single();

        if (fetchError || !account) {
          return new Response(
            JSON.stringify({ error: 'Account not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!account.refresh_token) {
          return new Response(
            JSON.stringify({ error: 'No refresh token available' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Refresh tokens
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            refresh_token: account.refresh_token,
            grant_type: 'refresh_token',
          }),
        });

        if (!refreshResponse.ok) {
          const error = await refreshResponse.text();
          console.error('[google-calendar-auth] Token refresh failed:', error);
          
          // Mark account as having sync error
          await supabase
            .from('connected_accounts')
            .update({ sync_error: 'Token refresh failed - reconnection required' })
            .eq('id', accountId);

          return new Response(
            JSON.stringify({ error: 'Failed to refresh token' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const newTokens = await refreshResponse.json();

        // Update in database
        await supabase
          .from('connected_accounts')
          .update({
            access_token: newTokens.access_token,
            token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
            sync_error: null,
          })
          .eq('id', accountId);

        console.log(`[google-calendar-auth] Tokens refreshed for account ${accountId}`);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'disconnect': {
        if (!accountId) {
          return new Response(
            JSON.stringify({ error: 'accountId is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get account from database
        const { data: account } = await supabase
          .from('connected_accounts')
          .select('access_token, webhook_channel_id, webhook_resource_id')
          .eq('id', accountId)
          .single();

        // Stop webhook subscription if exists (best effort)
        if (account?.webhook_channel_id && account?.webhook_resource_id && account?.access_token) {
          try {
            await fetch('https://www.googleapis.com/calendar/v3/channels/stop', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${account.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                id: account.webhook_channel_id,
                resourceId: account.webhook_resource_id,
              }),
            });
            console.log(`[google-calendar-auth] Webhook stopped for account ${accountId}`);
          } catch (e) {
            console.warn('[google-calendar-auth] Webhook stop failed (non-critical):', e);
          }
        }

        // Revoke token with Google (best effort)
        if (account?.access_token) {
          try {
            await fetch(`https://oauth2.googleapis.com/revoke?token=${account.access_token}`, {
              method: 'POST',
            });
            console.log(`[google-calendar-auth] Token revoked for account ${accountId}`);
          } catch (e) {
            console.warn('[google-calendar-auth] Token revocation failed (non-critical):', e);
          }
        }

        // Delete from database
        await supabase
          .from('connected_accounts')
          .delete()
          .eq('id', accountId);

        console.log(`[google-calendar-auth] Account ${accountId} disconnected`);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'sync': {
        // Manual sync action - Phase 6: Testing & Error Handling
        if (!accountId) {
          return new Response(
            JSON.stringify({ error: 'accountId is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get account from database
        const { data: account, error: fetchError } = await supabase
          .from('connected_accounts')
          .select('*')
          .eq('id', accountId)
          .single();

        if (fetchError || !account) {
          return new Response(
            JSON.stringify({ error: 'Account not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if token needs refresh
        let accessToken = account.access_token;
        if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
          if (!account.refresh_token) {
            return new Response(
              JSON.stringify({ error: 'Token expired and no refresh token available' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: GOOGLE_CLIENT_ID,
              client_secret: GOOGLE_CLIENT_SECRET,
              refresh_token: account.refresh_token,
              grant_type: 'refresh_token',
            }),
          });

          if (!refreshResponse.ok) {
            return new Response(
              JSON.stringify({ error: 'Token refresh failed' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const newTokens = await refreshResponse.json();
          accessToken = newTokens.access_token;

          await supabase
            .from('connected_accounts')
            .update({
              access_token: newTokens.access_token,
              token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
            })
            .eq('id', accountId);
        }

        // Sync recent events (last 30 days + next 30 days)
        const calendarId = account.calendar_id || 'primary';
        const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        const eventsResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (!eventsResponse.ok) {
          const errorText = await eventsResponse.text();
          console.error('[google-calendar-auth] Events sync failed:', errorText);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch calendar events' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const eventsData = await eventsResponse.json();
        let eventsUpdated = 0;

        // Process each event
        for (const event of eventsData.items || []) {
          if (!event.id) continue;

          const eventStatus = event.status === 'cancelled' ? 'cancelled' : 
            (event.end?.dateTime && new Date(event.end.dateTime) < new Date() ? 'completed' : 'confirmed');

          const { error: upsertError } = await supabase
            .from('calendar_events')
            .upsert({
              connected_account_id: accountId,
              external_event_id: event.id,
              title: event.summary || 'Untitled Event',
              start_time: event.start?.dateTime || event.start?.date,
              end_time: event.end?.dateTime || event.end?.date,
              status: eventStatus,
              description: event.description || null,
              location_id: account.location_id,
              all_day: !!event.start?.date,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'connected_account_id,external_event_id',
            });

          if (!upsertError) eventsUpdated++;
        }

        // Update last_synced_at and clear any sync errors
        await supabase
          .from('connected_accounts')
          .update({
            last_synced_at: new Date().toISOString(),
            sync_error: null,
          })
          .eq('id', accountId);

        console.log(`[google-calendar-auth] Manual sync completed: ${eventsUpdated} events processed`);

        return new Response(
          JSON.stringify({ success: true, eventsUpdated }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'refresh-webhook': {
        // Refresh webhook subscription - Phase 6: Testing & Error Handling
        if (!accountId) {
          return new Response(
            JSON.stringify({ error: 'accountId is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get account from database
        const { data: account, error: fetchError } = await supabase
          .from('connected_accounts')
          .select('*')
          .eq('id', accountId)
          .single();

        if (fetchError || !account) {
          return new Response(
            JSON.stringify({ error: 'Account not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Stop existing webhook if present
        if (account.webhook_channel_id && account.webhook_resource_id) {
          try {
            await fetch('https://www.googleapis.com/calendar/v3/channels/stop', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${account.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                id: account.webhook_channel_id,
                resourceId: account.webhook_resource_id,
              }),
            });
          } catch (e) {
            console.warn('[google-calendar-auth] Existing webhook stop failed:', e);
          }
        }

        // Create new webhook
        try {
          const calendarId = account.calendar_id || 'primary';
          const webhookData = await createWebhookSubscription(calendarId, account.access_token);

          if (webhookData) {
            await supabase
              .from('connected_accounts')
              .update({
                webhook_channel_id: webhookData.channelId,
                webhook_resource_id: webhookData.resourceId,
                webhook_expires_at: webhookData.expiresAt,
                sync_error: null,
              })
              .eq('id', accountId);

            console.log(`[google-calendar-auth] Webhook refreshed for account ${accountId}`);

            return new Response(
              JSON.stringify({ success: true, expiresAt: webhookData.expiresAt }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } catch (e) {
          console.error('[google-calendar-auth] Webhook refresh failed:', e);
        }

        return new Response(
          JSON.stringify({ error: 'Failed to refresh webhook' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('[google-calendar-auth] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Create a Google Calendar push notification subscription
 * 
 * @param calendarId - The calendar ID to watch
 * @param accessToken - Valid OAuth access token
 * @returns Webhook subscription details or null if failed
 */
async function createWebhookSubscription(
  calendarId: string,
  accessToken: string
): Promise<{ channelId: string; resourceId: string; expiresAt: string } | null> {
  const channelId = crypto.randomUUID();
  
  // Google webhooks expire after 7 days max
  const expiration = Date.now() + 7 * 24 * 60 * 60 * 1000;

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/watch`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: channelId,
        type: 'web_hook',
        address: WEBHOOK_URL,
        token: WEBHOOK_SECRET || undefined,
        expiration: expiration.toString(),
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[google-calendar-auth] Watch request failed:', errorText);
    throw new Error(`Watch request failed: ${errorText}`);
  }

  const watchData = await response.json();
  console.log('[google-calendar-auth] Watch response:', watchData);

  return {
    channelId,
    resourceId: watchData.resourceId,
    expiresAt: new Date(parseInt(watchData.expiration)).toISOString(),
  };
}
