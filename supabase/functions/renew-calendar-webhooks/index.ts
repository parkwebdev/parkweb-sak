/**
 * Renew Calendar Webhooks - Scheduled Function
 * 
 * Runs daily to renew expiring Google Calendar webhook subscriptions.
 * Google webhooks expire after 7 days max, so we renew 2 days before expiration.
 * 
 * @module renew-calendar-webhooks
 * @verified Phase 2.3 Complete - December 2025
 * @schedule Daily at 2:00 AM UTC (configured in config.toml)
 * 
 * TODO: Add CALENDAR_WEBHOOK_SECRET to Supabase secrets
 * TODO: Add support for Outlook webhook renewal when implemented
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// TODO: Add these secrets via Lovable secrets management
const WEBHOOK_SECRET = Deno.env.get('CALENDAR_WEBHOOK_SECRET') || '';
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') || '';
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') || '';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/google-calendar-webhook`;

// Renew webhooks that expire within this many days
const RENEWAL_THRESHOLD_DAYS = 2;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[renew-calendar-webhooks] Starting webhook renewal job');

  try {
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, supabaseServiceKey);

    // Find accounts with webhooks expiring soon
    const thresholdDate = new Date(Date.now() + RENEWAL_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);
    
    const { data: expiringAccounts, error: fetchError } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('provider', 'google_calendar')
      .eq('is_active', true)
      .not('webhook_channel_id', 'is', null)
      .lt('webhook_expires_at', thresholdDate.toISOString());

    if (fetchError) {
      console.error('[renew-calendar-webhooks] Error fetching accounts:', fetchError);
      throw fetchError;
    }

    console.log(`[renew-calendar-webhooks] Found ${expiringAccounts?.length || 0} accounts with expiring webhooks`);

    const results = {
      total: expiringAccounts?.length || 0,
      renewed: 0,
      failed: 0,
      errors: [] as string[],
    };

    if (!expiringAccounts || expiringAccounts.length === 0) {
      console.log('[renew-calendar-webhooks] No webhooks need renewal');
      return new Response(
        JSON.stringify({ success: true, ...results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process each account
    for (const account of expiringAccounts) {
      try {
        console.log(`[renew-calendar-webhooks] Renewing webhook for account ${account.id}`);
        
        // Stop existing webhook first
        if (account.webhook_channel_id && account.webhook_resource_id) {
          await stopExistingWebhook(account);
        }

        // Check if token needs refresh
        let accessToken = account.access_token;
        if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
          accessToken = await refreshAccessToken(supabase, account);
          if (!accessToken) {
            results.failed++;
            results.errors.push(`Account ${account.id}: Token refresh failed`);
            continue;
          }
        }

        // Create new webhook subscription
        const webhookResult = await createWebhookSubscription(
          supabase,
          account,
          accessToken
        );

        if (webhookResult.success) {
          results.renewed++;
          console.log(`[renew-calendar-webhooks] Successfully renewed webhook for ${account.id}`);
        } else {
          results.failed++;
          results.errors.push(`Account ${account.id}: ${webhookResult.error}`);
        }

      } catch (error: unknown) {
        results.failed++;
        const message = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Account ${account.id}: ${message}`);
        console.error(`[renew-calendar-webhooks] Error processing account ${account.id}:`, error);
      }
    }

    console.log('[renew-calendar-webhooks] Renewal job complete:', results);

    return new Response(
      JSON.stringify({ success: true, ...results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[renew-calendar-webhooks] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Stop an existing webhook subscription
 */
async function stopExistingWebhook(account: {
  access_token: string;
  webhook_channel_id: string;
  webhook_resource_id: string;
}): Promise<void> {
  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/channels/stop', {
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

    if (!response.ok) {
      // Log but don't fail - the webhook may have already expired
      console.warn('[renew-calendar-webhooks] Failed to stop existing webhook:', await response.text());
    } else {
      console.log('[renew-calendar-webhooks] Stopped existing webhook');
    }
  } catch (error) {
    console.warn('[renew-calendar-webhooks] Error stopping webhook:', error);
  }
}

/**
 * Refresh the access token
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
      console.error('[renew-calendar-webhooks] Token refresh failed');
      await supabase
        .from('connected_accounts')
        .update({ sync_error: 'Token refresh failed during webhook renewal' })
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
    console.error('[renew-calendar-webhooks] Token refresh error:', error);
    return null;
  }
}

/**
 * Create a new webhook subscription for a calendar
 */
async function createWebhookSubscription(
  supabase: ReturnType<typeof createClient>,
  account: { id: string; calendar_id: string | null },
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  const calendarId = account.calendar_id || 'primary';
  const channelId = crypto.randomUUID();
  
  // Webhooks expire after 7 days max
  const expiration = Date.now() + 7 * 24 * 60 * 60 * 1000;

  try {
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
      console.error('[renew-calendar-webhooks] Watch request failed:', errorText);
      
      await supabase
        .from('connected_accounts')
        .update({ sync_error: `Webhook renewal failed: ${errorText}` })
        .eq('id', account.id);

      return { success: false, error: errorText };
    }

    const watchData = await response.json();
    console.log('[renew-calendar-webhooks] Watch response:', watchData);

    // Update account with new webhook details
    await supabase
      .from('connected_accounts')
      .update({
        webhook_channel_id: channelId,
        webhook_resource_id: watchData.resourceId,
        webhook_expires_at: new Date(parseInt(watchData.expiration)).toISOString(),
        sync_error: null,
      })
      .eq('id', account.id);

    return { success: true };

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[renew-calendar-webhooks] Error creating subscription:', error);
    return { success: false, error: message };
  }
}
