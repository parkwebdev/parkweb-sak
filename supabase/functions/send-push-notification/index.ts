/**
 * Send Push Notification Edge Function
 * 
 * Sends Web Push notifications to user devices using VAPID authentication.
 * Implements RFC 8291 (Message Encryption for Web Push) with proper
 * ECDH key exchange and AES-128-GCM encryption.
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
  let result = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = result.length % 4;
  if (padding) {
    result += '='.repeat(4 - padding);
  }
  return result;
}

/**
 * Convert base64 to base64url
 */
function base64ToBase64url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decode base64url string to Uint8Array
 */
function base64urlToBytes(base64url: string): Uint8Array {
  const base64 = base64urlToBase64(base64url);
  const binary = atob(base64);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

/**
 * Encode bytes to base64url
 */
function bytesToBase64url(bytes: Uint8Array): string {
  return base64ToBase64url(btoa(String.fromCharCode(...bytes)));
}

/**
 * HMAC-based Key Derivation Function (HKDF)
 * RFC 5869 implementation
 */
async function hkdf(
  ikm: Uint8Array,
  salt: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<Uint8Array> {
  // Extract
  const extractKey = await crypto.subtle.importKey(
    'raw',
    salt.length > 0 ? salt : new Uint8Array(32),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const prk = new Uint8Array(await crypto.subtle.sign('HMAC', extractKey, ikm));

  // Expand
  const expandKey = await crypto.subtle.importKey(
    'raw',
    prk,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  let result = new Uint8Array(0);
  let prev = new Uint8Array(0);
  let counter = 1;

  while (result.length < length) {
    const input = new Uint8Array([...prev, ...info, counter]);
    prev = new Uint8Array(await crypto.subtle.sign('HMAC', expandKey, input));
    result = new Uint8Array([...result, ...prev]);
    counter++;
  }

  return result.slice(0, length);
}

/**
 * Generate VAPID JWT token for push authentication
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
  const publicKeyBytes = base64urlToBytes(publicKey);
  
  // Extract X and Y coordinates from uncompressed public key
  const xBytes = publicKeyBytes.slice(1, 33);
  const yBytes = publicKeyBytes.slice(33, 65);
  
  // Convert to base64url for JWK
  const x = bytesToBase64url(xBytes);
  const y = bytesToBase64url(yBytes);
  
  // The private key is the raw 32-byte 'd' parameter
  const d = base64ToBase64url(privateKey);

  // Create JWK for EC P-256 private key
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    x,
    y,
    d,
  };

  // Import private key using JWK format
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

  // Convert signature to base64url (crypto.subtle returns IEEE P1363 format)
  const signatureB64 = bytesToBase64url(new Uint8Array(signature));

  return `${unsignedToken}.${signatureB64}`;
}

/**
 * Encrypt a message for Web Push using RFC 8291 (aes128gcm)
 * 
 * This implements the full encryption process:
 * 1. Generate ephemeral ECDH key pair
 * 2. Perform ECDH with subscriber's public key
 * 3. Derive encryption keys using HKDF
 * 4. Encrypt payload with AES-128-GCM
 */
async function encryptPayload(
  payload: string,
  p256dhKey: string,
  authSecret: string
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; serverPublicKey: Uint8Array }> {
  const encoder = new TextEncoder();
  
  // Decode subscriber keys
  const subscriberPublicKeyBytes = base64urlToBytes(p256dhKey);
  const authSecretBytes = base64urlToBytes(authSecret);

  // Generate ephemeral ECDH key pair for this message
  const serverKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );

  // Export server public key (uncompressed format)
  const serverPublicKeyRaw = await crypto.subtle.exportKey('raw', serverKeyPair.publicKey);
  const serverPublicKey = new Uint8Array(serverPublicKeyRaw);

  // Import subscriber's public key
  const subscriberPublicKey = await crypto.subtle.importKey(
    'raw',
    subscriberPublicKeyBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // Perform ECDH to get shared secret
  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: subscriberPublicKey },
    serverKeyPair.privateKey,
    256
  );
  const sharedSecret = new Uint8Array(sharedSecretBits);

  // Generate random salt (16 bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // RFC 8291: IKM = HKDF-Extract(auth_secret, ecdh_secret)
  // Then derive PRK using the shared info
  
  // Key info for HKDF: "WebPush: info" || 0x00 || ua_public || as_public
  const keyInfoPrefix = encoder.encode('WebPush: info\0');
  const keyInfo = new Uint8Array([
    ...keyInfoPrefix,
    ...subscriberPublicKeyBytes,
    ...serverPublicKey,
  ]);

  // Derive the input keying material (IKM) from auth secret and shared secret
  const ikm = await hkdf(sharedSecret, authSecretBytes, keyInfo, 32);

  // Derive content encryption key (CEK) - 16 bytes
  const cekInfo = encoder.encode('Content-Encoding: aes128gcm\0');
  const contentEncryptionKey = await hkdf(ikm, salt, cekInfo, 16);

  // Derive nonce - 12 bytes
  const nonceInfo = encoder.encode('Content-Encoding: nonce\0');
  const nonce = await hkdf(ikm, salt, nonceInfo, 12);

  // Prepare payload with padding (add 0x02 delimiter and optional padding)
  const payloadBytes = encoder.encode(payload);
  const paddedPayload = new Uint8Array(payloadBytes.length + 1);
  paddedPayload.set(payloadBytes);
  paddedPayload[payloadBytes.length] = 0x02; // Delimiter

  // Import AES key
  const aesKey = await crypto.subtle.importKey(
    'raw',
    contentEncryptionKey,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  // Encrypt with AES-128-GCM
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce, tagLength: 128 },
    aesKey,
    paddedPayload
  );

  return {
    ciphertext: new Uint8Array(ciphertextBuffer),
    salt,
    serverPublicKey,
  };
}

/**
 * Build the aes128gcm encrypted content body per RFC 8291
 * 
 * Format:
 * - salt (16 bytes)
 * - rs (4 bytes, record size as uint32 big-endian)
 * - idlen (1 byte, key ID length)
 * - keyid (idlen bytes, server public key)
 * - ciphertext
 */
function buildAes128gcmBody(
  salt: Uint8Array,
  serverPublicKey: Uint8Array,
  ciphertext: Uint8Array
): Uint8Array {
  // Record size (4096 is standard, but we use a smaller value for single-record messages)
  const recordSize = 4096;
  const rs = new Uint8Array(4);
  const view = new DataView(rs.buffer);
  view.setUint32(0, recordSize, false); // big-endian

  // Key ID length and key ID (server public key)
  const idlen = new Uint8Array([serverPublicKey.length]);

  // Combine all parts
  const body = new Uint8Array(
    salt.length + rs.length + idlen.length + serverPublicKey.length + ciphertext.length
  );
  
  let offset = 0;
  body.set(salt, offset); offset += salt.length;
  body.set(rs, offset); offset += rs.length;
  body.set(idlen, offset); offset += idlen.length;
  body.set(serverPublicKey, offset); offset += serverPublicKey.length;
  body.set(ciphertext, offset);

  return body;
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

    // Encrypt the payload using RFC 8291
    const { ciphertext, salt, serverPublicKey } = await encryptPayload(
      notificationPayload,
      subscription.p256dh,
      subscription.auth
    );

    // Build the encrypted body
    const body = buildAes128gcmBody(salt, serverPublicKey, ciphertext);

    // Send push request
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `vapid t=${vapidJwt}, k=${vapidPublicKey}`,
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400', // 24 hours
      },
      body: body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Push failed for ${subscription.endpoint}: ${response.status} - ${errorText}`);
      
      // 410 Gone or 404 means subscription expired
      if (response.status === 410 || response.status === 404) {
        return { success: false, error: 'subscription_expired' };
      }
      
      // 403 typically means VAPID key mismatch - subscription needs to be recreated
      if (response.status === 403) {
        return { success: false, error: 'vapid_mismatch' };
      }
      
      return { success: false, error: `HTTP ${response.status}` };
    }

    return { success: true };
  } catch (error: unknown) {
    console.error('Error sending push:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
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

    // Clean up expired or invalid subscriptions
    const subscriptionsToDelete = subscriptions
      .filter((_, i) => results[i].error === 'subscription_expired' || results[i].error === 'vapid_mismatch')
      .map(sub => sub.endpoint);

    if (subscriptionsToDelete.length > 0) {
      console.log(`Cleaning up ${subscriptionsToDelete.length} invalid subscription(s)`);
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', subscriptionsToDelete);
    }

    const successCount = results.filter(r => r.success).length;
    const vapidMismatchCount = results.filter(r => r.error === 'vapid_mismatch').length;
    
    return new Response(
      JSON.stringify({ 
        sent: successCount, 
        total: subscriptions.length,
        expired: subscriptionsToDelete.length,
        vapid_mismatch: vapidMismatchCount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in send-push-notification:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
