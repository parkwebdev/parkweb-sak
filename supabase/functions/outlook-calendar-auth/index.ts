/**
 * Outlook Calendar OAuth Edge Function
 * 
 * Handles OAuth 2.0 flow for Microsoft Outlook Calendar integration.
 * Actions: initiate, callback, refresh, disconnect
 * 
 * @module outlook-calendar-auth
 * @verified Phase 3.2 Complete - December 2025
 * 
 * Webhook Integration:
 * - On successful callback, creates a Microsoft Graph subscription for calendar changes
 * - Subscriptions notify us of event changes in real-time for accurate booking analytics
 * - Subscriptions expire after 3 days (Microsoft limit) and are renewed by renew-calendar-webhooks
 * 
 * TODO: Add MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_REDIRECT_URI secrets
 * TODO: Add CALENDAR_WEBHOOK_SECRET for webhook validation
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MICROSOFT_CLIENT_ID = Deno.env.get('MICROSOFT_CLIENT_ID') || '';
const MICROSOFT_CLIENT_SECRET = Deno.env.get('MICROSOFT_CLIENT_SECRET') || '';
const MICROSOFT_REDIRECT_URI = Deno.env.get('MICROSOFT_REDIRECT_URI') || '';
const WEBHOOK_SECRET = Deno.env.get('CALENDAR_WEBHOOK_SECRET') || '';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/outlook-calendar-webhook`;

const SCOPES = [
  'openid',
  'email',
  'offline_access',
  'Calendars.Read',
  'Calendars.ReadWrite',
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

    console.log(`[outlook-calendar-auth] Action: ${action}, Agent: ${agentId}, Location: ${locationId}`);

    // Validate required environment variables
    if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET) {
      console.error('[outlook-calendar-auth] Missing Microsoft OAuth credentials');
      return new Response(
        JSON.stringify({ 
          error: 'Outlook Calendar integration not configured',
          details: 'Please add MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET secrets' 
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
          provider: 'outlook',
          locationId: locationId || null,
          agentId,
          userId,
          timestamp: Date.now(),
        });
        const stateParam = btoa(stateData);

        const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
        authUrl.searchParams.set('client_id', MICROSOFT_CLIENT_ID);
        authUrl.searchParams.set('redirect_uri', MICROSOFT_REDIRECT_URI);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', SCOPES);
        authUrl.searchParams.set('response_mode', 'query');
        authUrl.searchParams.set('prompt', 'consent');
        authUrl.searchParams.set('state', stateParam);

        console.log(`[outlook-calendar-auth] Generated auth URL for agent ${agentId}`);

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
        const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: MICROSOFT_CLIENT_ID,
            client_secret: MICROSOFT_CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: MICROSOFT_REDIRECT_URI,
            scope: SCOPES,
          }),
        });

        if (!tokenResponse.ok) {
          const error = await tokenResponse.text();
          console.error('[outlook-calendar-auth] Token exchange failed:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to exchange authorization code' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const tokens = await tokenResponse.json();
        console.log('[outlook-calendar-auth] Token exchange successful');

        // Get user email from Microsoft Graph
        const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        if (!userInfoResponse.ok) {
          console.error('[outlook-calendar-auth] Failed to get user info');
          return new Response(
            JSON.stringify({ error: 'Failed to get user information' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const userInfo = await userInfoResponse.json();
        const email = userInfo.mail || userInfo.userPrincipalName;
        console.log(`[outlook-calendar-auth] Connected account: ${email}`);

        // Get default calendar info
        const calendarResponse = await fetch('https://graph.microsoft.com/v1.0/me/calendar', {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        let calendarId = 'default';
        let calendarName = 'Calendar';
        if (calendarResponse.ok) {
          const calendarInfo = await calendarResponse.json();
          calendarId = calendarInfo.id;
          calendarName = calendarInfo.name;
        }

        // Create webhook subscription for real-time sync
        let webhookSubscriptionId: string | null = null;
        let webhookExpiresAt: string | null = null;

        try {
          const webhookResult = await createWebhookSubscription(tokens.access_token);
          if (webhookResult) {
            webhookSubscriptionId = webhookResult.subscriptionId;
            webhookExpiresAt = webhookResult.expiresAt;
            console.log(`[outlook-calendar-auth] Webhook subscription created: ${webhookSubscriptionId}`);
          }
        } catch (webhookError) {
          // Log but don't fail the connection - webhook can be set up later
          console.warn('[outlook-calendar-auth] Failed to create webhook subscription:', webhookError);
        }

        // Store in database
        const { data: account, error: insertError } = await supabase
          .from('connected_accounts')
          .insert({
            location_id: stateData.locationId,
            agent_id: stateData.agentId,
            user_id: stateData.userId,
            provider: 'outlook_calendar',
            account_email: email,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
            calendar_id: calendarId,
            calendar_name: calendarName,
            is_active: true,
            webhook_channel_id: webhookSubscriptionId,
            webhook_resource_id: null, // Outlook doesn't have separate resource ID
            webhook_expires_at: webhookExpiresAt,
          })
          .select()
          .single();

        if (insertError) {
          console.error('[outlook-calendar-auth] Database insert error:', insertError);
          return new Response(
            JSON.stringify({ error: 'Failed to save connection' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`[outlook-calendar-auth] Account saved: ${account.id}`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            accountId: account.id,
            webhookEnabled: !!webhookSubscriptionId,
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
        const refreshResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
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

        if (!refreshResponse.ok) {
          const error = await refreshResponse.text();
          console.error('[outlook-calendar-auth] Token refresh failed:', error);
          
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
            refresh_token: newTokens.refresh_token || account.refresh_token,
            token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
            sync_error: null,
          })
          .eq('id', accountId);

        console.log(`[outlook-calendar-auth] Tokens refreshed for account ${accountId}`);

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
          .select('access_token, webhook_channel_id')
          .eq('id', accountId)
          .single();

        // Delete webhook subscription if exists (best effort)
        if (account?.webhook_channel_id && account?.access_token) {
          try {
            await fetch(
              `https://graph.microsoft.com/v1.0/subscriptions/${account.webhook_channel_id}`,
              {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${account.access_token}` },
              }
            );
            console.log(`[outlook-calendar-auth] Webhook subscription deleted for account ${accountId}`);
          } catch (e) {
            console.warn('[outlook-calendar-auth] Webhook deletion failed (non-critical):', e);
          }
        }

        // Delete from database
        await supabase
          .from('connected_accounts')
          .delete()
          .eq('id', accountId);

        console.log(`[outlook-calendar-auth] Account ${accountId} disconnected`);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('[outlook-calendar-auth] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Create a Microsoft Graph subscription for calendar events
 * 
 * @param accessToken - Valid OAuth access token
 * @returns Subscription details or null if failed
 */
async function createWebhookSubscription(
  accessToken: string
): Promise<{ subscriptionId: string; expiresAt: string } | null> {
  // Microsoft Graph subscriptions for calendar events expire after 3 days max
  const expirationDateTime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  const response = await fetch('https://graph.microsoft.com/v1.0/subscriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      changeType: 'created,updated,deleted',
      notificationUrl: WEBHOOK_URL,
      resource: '/me/events',
      expirationDateTime: expirationDateTime.toISOString(),
      clientState: WEBHOOK_SECRET || undefined,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[outlook-calendar-auth] Subscription creation failed:', errorText);
    throw new Error(`Subscription creation failed: ${errorText}`);
  }

  const subscriptionData = await response.json();
  console.log('[outlook-calendar-auth] Subscription response:', subscriptionData);

  return {
    subscriptionId: subscriptionData.id,
    expiresAt: subscriptionData.expirationDateTime,
  };
}
