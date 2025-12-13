/**
 * Google Calendar OAuth Edge Function
 * 
 * Handles OAuth 2.0 flow for Google Calendar integration.
 * Actions: initiate, callback, refresh, disconnect
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') || '';
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') || '';
const GOOGLE_REDIRECT_URI = Deno.env.get('GOOGLE_REDIRECT_URI') || '';

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
          JSON.stringify({ success: true, accountId: account.id }),
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
          .select('access_token')
          .eq('id', accountId)
          .single();

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
