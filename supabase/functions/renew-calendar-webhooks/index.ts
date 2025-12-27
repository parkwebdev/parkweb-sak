/**
 * Renew Calendar Webhooks - Scheduled Function
 * 
 * Runs daily to renew expiring Google Calendar and Outlook webhook subscriptions.
 * - Google webhooks expire after 7 days max, we renew 2 days before expiration
 * - Outlook subscriptions expire after 3 days max, we renew 1 day before expiration
 * 
 * @module renew-calendar-webhooks
 * @verified Phase 3 & 4 Complete - December 2025
 * @schedule Daily at 2:00 AM UTC (configured in config.toml)
 * 
 * TODO: Add CALENDAR_WEBHOOK_SECRET to Supabase secrets
 * TODO: Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 * TODO: Add MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Secrets
const WEBHOOK_SECRET = Deno.env.get('CALENDAR_WEBHOOK_SECRET') || '';
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') || '';
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') || '';
const MICROSOFT_CLIENT_ID = Deno.env.get('MICROSOFT_CLIENT_ID') || '';
const MICROSOFT_CLIENT_SECRET = Deno.env.get('MICROSOFT_CLIENT_SECRET') || '';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const GOOGLE_WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/google-calendar-webhook`;
const OUTLOOK_WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/outlook-calendar-webhook`;

// Microsoft OAuth scopes
const MICROSOFT_SCOPES = [
  'openid',
  'email',
  'offline_access',
  'Calendars.Read',
  'Calendars.ReadWrite',
].join(' ');

// Renewal thresholds
const GOOGLE_RENEWAL_DAYS = 2;   // Renew 2 days before expiration
const OUTLOOK_RENEWAL_DAYS = 1;  // Renew 1 day before expiration (3 day max lifetime)

interface RenewalResult {
  total: number;
  renewed: number;
  failed: number;
  errors: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[renew-calendar-webhooks] Starting webhook renewal job');

  try {
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, supabaseServiceKey);

    // Process Google accounts
    const googleResults = await renewGoogleWebhooks(supabase);
    
    // Process Outlook accounts
    const outlookResults = await renewOutlookWebhooks(supabase);

    // Combine results
    const combinedResults = {
      google: googleResults,
      outlook: outlookResults,
      total: googleResults.total + outlookResults.total,
      renewed: googleResults.renewed + outlookResults.renewed,
      failed: googleResults.failed + outlookResults.failed,
    };

    console.log('[renew-calendar-webhooks] Renewal job complete:', combinedResults);

    return new Response(
      JSON.stringify({ success: true, ...combinedResults }),
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
 * Renew Google Calendar webhook subscriptions
 */
async function renewGoogleWebhooks(
  supabase: ReturnType<typeof createClient>
): Promise<RenewalResult> {
  const thresholdDate = new Date(Date.now() + GOOGLE_RENEWAL_DAYS * 24 * 60 * 60 * 1000);
  
  const { data: expiringAccounts, error: fetchError } = await supabase
    .from('connected_accounts')
    .select('*')
    .eq('provider', 'google_calendar')
    .eq('is_active', true)
    .not('webhook_channel_id', 'is', null)
    .lt('webhook_expires_at', thresholdDate.toISOString());

  if (fetchError) {
    console.error('[renew-calendar-webhooks] Error fetching Google accounts:', fetchError);
    return { total: 0, renewed: 0, failed: 0, errors: [fetchError.message] };
  }

  console.log(`[renew-calendar-webhooks] Found ${expiringAccounts?.length || 0} Google accounts with expiring webhooks`);

  const results: RenewalResult = {
    total: expiringAccounts?.length || 0,
    renewed: 0,
    failed: 0,
    errors: [],
  };

  if (!expiringAccounts || expiringAccounts.length === 0) {
    return results;
  }

  for (const account of expiringAccounts) {
    try {
      console.log(`[renew-calendar-webhooks] Renewing Google webhook for account ${account.id}`);
      
      // Stop existing webhook first
      if (account.webhook_channel_id && account.webhook_resource_id) {
        await stopGoogleWebhook(account);
      }

      // Check if token needs refresh
      let accessToken = account.access_token;
      if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
        accessToken = await refreshGoogleToken(supabase, account);
        if (!accessToken) {
          results.failed++;
          results.errors.push(`Google ${account.id}: Token refresh failed`);
          continue;
        }
      }

      // Create new webhook subscription
      const webhookResult = await createGoogleWebhook(supabase, account, accessToken);

      if (webhookResult.success) {
        results.renewed++;
      } else {
        results.failed++;
        results.errors.push(`Google ${account.id}: ${webhookResult.error}`);
      }

    } catch (error: unknown) {
      results.failed++;
      const message = error instanceof Error ? error.message : 'Unknown error';
      results.errors.push(`Google ${account.id}: ${message}`);
    }
  }

  return results;
}

/**
 * Renew Outlook Calendar webhook subscriptions
 */
async function renewOutlookWebhooks(
  supabase: ReturnType<typeof createClient>
): Promise<RenewalResult> {
  const thresholdDate = new Date(Date.now() + OUTLOOK_RENEWAL_DAYS * 24 * 60 * 60 * 1000);
  
  const { data: expiringAccounts, error: fetchError } = await supabase
    .from('connected_accounts')
    .select('*')
    .eq('provider', 'outlook_calendar')
    .eq('is_active', true)
    .not('webhook_channel_id', 'is', null)
    .lt('webhook_expires_at', thresholdDate.toISOString());

  if (fetchError) {
    console.error('[renew-calendar-webhooks] Error fetching Outlook accounts:', fetchError);
    return { total: 0, renewed: 0, failed: 0, errors: [fetchError.message] };
  }

  console.log(`[renew-calendar-webhooks] Found ${expiringAccounts?.length || 0} Outlook accounts with expiring webhooks`);

  const results: RenewalResult = {
    total: expiringAccounts?.length || 0,
    renewed: 0,
    failed: 0,
    errors: [],
  };

  if (!expiringAccounts || expiringAccounts.length === 0) {
    return results;
  }

  for (const account of expiringAccounts) {
    try {
      console.log(`[renew-calendar-webhooks] Renewing Outlook webhook for account ${account.id}`);

      // Check if token needs refresh
      let accessToken = account.access_token;
      if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
        accessToken = await refreshOutlookToken(supabase, account);
        if (!accessToken) {
          results.failed++;
          results.errors.push(`Outlook ${account.id}: Token refresh failed`);
          continue;
        }
      }

      // Microsoft Graph allows PATCH to renew subscription
      const webhookResult = await renewOutlookSubscription(supabase, account, accessToken);

      if (webhookResult.success) {
        results.renewed++;
      } else {
        results.failed++;
        results.errors.push(`Outlook ${account.id}: ${webhookResult.error}`);
      }

    } catch (error: unknown) {
      results.failed++;
      const message = error instanceof Error ? error.message : 'Unknown error';
      results.errors.push(`Outlook ${account.id}: ${message}`);
    }
  }

  return results;
}

// ============ Google Helper Functions ============

async function stopGoogleWebhook(account: {
  access_token: string;
  webhook_channel_id: string;
  webhook_resource_id: string;
}): Promise<void> {
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
  } catch (error) {
    console.warn('[renew-calendar-webhooks] Error stopping Google webhook:', error);
  }
}

async function refreshGoogleToken(
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
  } catch {
    return null;
  }
}

async function createGoogleWebhook(
  supabase: ReturnType<typeof createClient>,
  account: { id: string; calendar_id: string | null },
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  const calendarId = account.calendar_id || 'primary';
  const channelId = crypto.randomUUID();
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
          address: GOOGLE_WEBHOOK_URL,
          token: WEBHOOK_SECRET || undefined,
          expiration: expiration.toString(),
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      await supabase
        .from('connected_accounts')
        .update({ sync_error: `Webhook renewal failed: ${errorText}` })
        .eq('id', account.id);
      return { success: false, error: errorText };
    }

    const watchData = await response.json();

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
    return { success: false, error: message };
  }
}

// ============ Outlook Helper Functions ============

async function refreshOutlookToken(
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
        scope: MICROSOFT_SCOPES,
      }),
    });

    if (!response.ok) {
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
        refresh_token: tokens.refresh_token || account.refresh_token,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      })
      .eq('id', account.id);

    return tokens.access_token;
  } catch {
    return null;
  }
}

async function renewOutlookSubscription(
  supabase: ReturnType<typeof createClient>,
  account: { id: string; webhook_channel_id: string | null },
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  if (!account.webhook_channel_id) {
    return { success: false, error: 'No subscription ID' };
  }

  // Microsoft Graph allows PATCH to extend subscription expiration
  const newExpiration = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/subscriptions/${account.webhook_channel_id}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expirationDateTime: newExpiration.toISOString(),
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      
      // If subscription not found, try to create a new one
      if (response.status === 404) {
        console.log('[renew-calendar-webhooks] Outlook subscription not found, creating new one');
        return await createOutlookSubscription(supabase, account.id, accessToken);
      }

      await supabase
        .from('connected_accounts')
        .update({ sync_error: `Webhook renewal failed: ${errorText}` })
        .eq('id', account.id);
      return { success: false, error: errorText };
    }

    const subscriptionData = await response.json();

    await supabase
      .from('connected_accounts')
      .update({
        webhook_expires_at: subscriptionData.expirationDateTime,
        sync_error: null,
      })
      .eq('id', account.id);

    return { success: true };

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

async function createOutlookSubscription(
  supabase: ReturnType<typeof createClient>,
  accountId: string,
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  const expirationDateTime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        changeType: 'created,updated,deleted',
        notificationUrl: OUTLOOK_WEBHOOK_URL,
        resource: '/me/events',
        expirationDateTime: expirationDateTime.toISOString(),
        clientState: WEBHOOK_SECRET || undefined,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      await supabase
        .from('connected_accounts')
        .update({ sync_error: `Webhook creation failed: ${errorText}` })
        .eq('id', accountId);
      return { success: false, error: errorText };
    }

    const subscriptionData = await response.json();

    await supabase
      .from('connected_accounts')
      .update({
        webhook_channel_id: subscriptionData.id,
        webhook_expires_at: subscriptionData.expirationDateTime,
        sync_error: null,
      })
      .eq('id', accountId);

    return { success: true };

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}
