/**
 * Send Push Notification Edge Function
 * 
 * Sends Web Push notifications to user devices using VAPID authentication.
 * Called when creating notifications to deliver cross-device alerts.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  user_id: string;
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Convert base64url to base64
 */
function base64urlToBase64(base64url: string): string {
  return base64url.replace(/-/g, '+').replace(/_/g, '/');
}

/**
 * Convert base64 to base64url
 */
function base64ToBase64url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Generate VAPID JWT token for push authentication
 * 
 * VAPID keys are raw EC P-256 keys, not PKCS#8 format.
 * We import them using JWK format which handles raw keys properly.
 */
async function generateVapidJwt(
  audience: string,
  subject: string,
  publicKey: string,
  privateKey: string
): Promise<string> {
  // Create JWT header
  const header = { typ: 'JWT', alg: 'ES256' };
  
  // Create JWT payload (12 hour expiry)
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: subject,
  };

  // Base64url encode header and payload
  const encoder = new TextEncoder();
  const headerB64 = base64ToBase64url(btoa(JSON.stringify(header)));
  const payloadB64 = base64ToBase64url(btoa(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Decode the raw public key (65 bytes uncompressed: 0x04 + 32-byte X + 32-byte Y)
  const publicKeyBytes = Uint8Array.from(
    atob(base64urlToBase64(publicKey)), 
    c => c.charCodeAt(0)
  );
  
  // Extract X and Y coordinates from uncompressed public key
  // Skip first byte (0x04 marker) and split remaining 64 bytes
  const xBytes = publicKeyBytes.slice(1, 33);
  const yBytes = publicKeyBytes.slice(33, 65);
  
  // Convert to base64url for JWK
  const x = base64ToBase64url(btoa(String.fromCharCode(...xBytes)));
  const y = base64ToBase64url(btoa(String.fromCharCode(...yBytes)));
  
  // The private key is already the raw 32-byte 'd' parameter in base64url
  const d = base64ToBase64url(privateKey);

  // Create JWK for EC P-256 private key
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    x,
    y,
    d,
  };

  // Import private key using JWK format (handles raw keys properly)
  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  // Sign the token
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  // Convert DER signature to raw format (required for JWT)
  // crypto.subtle returns IEEE P1363 format already for ECDSA
  const signatureB64 = base64ToBase64url(
    btoa(String.fromCharCode(...new Uint8Array(signature)))
  );

  return `${unsignedToken}.${signatureB64}`;
}

/**
 * Send a push notification to a single subscription
 */
async function sendPushToSubscription(
  subscription: PushSubscription,
  payload: PushPayload,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Parse endpoint URL to get audience
    const endpointUrl = new URL(subscription.endpoint);
    const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;

    // Generate VAPID JWT
    const vapidJwt = await generateVapidJwt(
      audience,
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey
    );

    // Create notification payload
    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/notification-icon-192.png',
      badge: payload.badge || '/notification-badge-96.png',
      tag: payload.tag,
      data: {
        url: payload.url || '/',
        ...payload.data,
      },
    });

    // Encrypt payload using subscription keys
    // For simplicity, we'll send unencrypted (browser will handle)
    // In production, implement proper encryption with aesgcm
    
    const encoder = new TextEncoder();
    const payloadBytes = encoder.encode(notificationPayload);

    // Send push request
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `vapid t=${vapidJwt}, k=${vapidPublicKey}`,
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400', // 24 hours
      },
      body: payloadBytes,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Push failed for ${subscription.endpoint}: ${response.status} - ${errorText}`);
      
      // 410 Gone means subscription expired, should be cleaned up
      if (response.status === 410 || response.status === 404) {
        return { success: false, error: 'subscription_expired' };
      }
      
      return { success: false, error: `HTTP ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending push:', error);
    return { success: false, error: String(error) };
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get VAPID keys from environment
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT');

    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      console.error('Missing VAPID configuration');
      return new Response(
        JSON.stringify({ error: 'Push notifications not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const payload: PushPayload = await req.json();

    if (!payload.user_id || !payload.title || !payload.body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user's push subscriptions
    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth')
      .eq('user_id', payload.user_id);

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${payload.user_id}`);
      return new Response(
        JSON.stringify({ sent: 0, message: 'No subscriptions found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending push to ${subscriptions.length} subscription(s) for user ${payload.user_id}`);

    // Send to all subscriptions
    const results = await Promise.all(
      subscriptions.map(sub => 
        sendPushToSubscription(sub, payload, vapidPublicKey, vapidPrivateKey, vapidSubject)
      )
    );

    // Clean up expired subscriptions
    const expiredEndpoints = subscriptions
      .filter((_, i) => results[i].error === 'subscription_expired')
      .map(sub => sub.endpoint);

    if (expiredEndpoints.length > 0) {
      console.log(`Cleaning up ${expiredEndpoints.length} expired subscription(s)`);
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expiredEndpoints);
    }

    const successCount = results.filter(r => r.success).length;
    
    return new Response(
      JSON.stringify({ 
        sent: successCount, 
        total: subscriptions.length,
        expired: expiredEndpoints.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-push-notification:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
