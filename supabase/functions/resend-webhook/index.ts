/**
 * Resend Webhook Edge Function
 * 
 * Handles email delivery events from Resend (via Svix).
 * Updates email_delivery_logs with delivery status, opens, clicks, bounces.
 * 
 * @module functions/resend-webhook
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { corsHeaders } from "../_shared/cors.ts";
import { getErrorMessage } from "../_shared/errors.ts";

/** Resend event types we handle */
type ResendEventType = 
  | 'email.sent'
  | 'email.delivered'
  | 'email.bounced'
  | 'email.complained'
  | 'email.opened'
  | 'email.clicked';

/** Resend webhook payload structure */
interface ResendWebhookPayload {
  type: ResendEventType;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject?: string;
    bounce?: {
      message: string;
      type: string;
    };
    click?: {
      link: string;
      timestamp: string;
    };
  };
}

/** Map Resend event types to our status values */
const STATUS_MAP: Record<ResendEventType, string> = {
  'email.sent': 'sent',
  'email.delivered': 'delivered',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
  'email.opened': 'delivered', // Keep delivered status, just update opened_at
  'email.clicked': 'delivered', // Keep delivered status, just update clicked_at
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Verify Svix headers (Resend uses Svix for webhooks)
    const svixId = req.headers.get('svix-id');
    const svixTimestamp = req.headers.get('svix-timestamp');
    const svixSignature = req.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.warn('Missing Svix headers - webhook may be spoofed');
      // In production, you should verify the signature
      // For now, we log a warning but continue processing
    }

    // TODO: Implement signature verification with RESEND_WEBHOOK_SECRET
    // const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET');
    // if (webhookSecret) {
    //   const wh = new Webhook(webhookSecret);
    //   const rawBody = await req.text();
    //   wh.verify(rawBody, { 'svix-id': svixId, 'svix-timestamp': svixTimestamp, 'svix-signature': svixSignature });
    // }

    const payload: ResendWebhookPayload = await req.json();
    const { type, data } = payload;

    console.log(`Received Resend webhook: ${type} for email ${data.email_id}`);

    // Check if we handle this event type
    const status = STATUS_MAP[type];
    if (!status) {
      console.log(`Unhandled event type: ${type}`);
      return new Response(
        JSON.stringify({ message: 'Unhandled event type', type }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Build update data based on event type
    const updateData: Record<string, unknown> = {
      resend_email_id: data.email_id,
      updated_at: new Date().toISOString(),
    };

    // Always update status for certain events
    if (['email.sent', 'email.delivered', 'email.bounced', 'email.complained'].includes(type)) {
      updateData.status = status;
    }

    // Event-specific fields
    switch (type) {
      case 'email.sent':
        updateData.to_email = data.to?.[0];
        updateData.from_email = data.from;
        updateData.subject = data.subject;
        break;

      case 'email.bounced':
        updateData.bounce_reason = data.bounce?.message || 'Unknown bounce reason';
        updateData.metadata = {
          bounce_type: data.bounce?.type,
          bounced_at: new Date().toISOString(),
        };
        break;

      case 'email.complained':
        updateData.metadata = {
          complained_at: new Date().toISOString(),
        };
        break;

      case 'email.opened':
        updateData.opened_at = new Date().toISOString();
        break;

      case 'email.clicked':
        updateData.clicked_at = new Date().toISOString();
        if (data.click?.link) {
          updateData.metadata = {
            last_clicked_link: data.click.link,
            clicked_at: data.click.timestamp,
          };
        }
        break;
    }

    // Upsert the email log record
    const { error: upsertError } = await supabase
      .from('email_delivery_logs')
      .upsert(updateData, { 
        onConflict: 'resend_email_id',
        ignoreDuplicates: false,
      });

    if (upsertError) {
      console.error('Failed to update email log:', upsertError);
      // Don't throw - we want to return 200 to Resend to prevent retries
    } else {
      console.log(`Email log updated: ${data.email_id} -> ${status}`);
    }

    return new Response(
      JSON.stringify({ success: true, processed: type }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Resend webhook error:', error);
    
    // Return 200 even on error to prevent Resend from retrying
    // Log the error for debugging
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: getErrorMessage(error),
        message: 'Error logged but returning 200 to prevent retries',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
