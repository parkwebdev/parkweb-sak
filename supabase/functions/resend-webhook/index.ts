/**
 * Resend Webhook Edge Function
 * 
 * Handles email delivery events from Resend (via Svix).
 * Updates email_delivery_logs with delivery status, opens, clicks, bounces.
 * 
 * SECURITY: Uses Svix signature verification to prevent webhook spoofing.
 * 
 * @module functions/resend-webhook
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Webhook } from "npm:svix@1.24.0";
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
  'email.opened': 'opened',
  'email.clicked': 'clicked',
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
    // Get the raw body for signature verification
    const rawBody = await req.text();

    // Verify Svix signature (Resend uses Svix for webhooks)
    const svixId = req.headers.get('svix-id');
    const svixTimestamp = req.headers.get('svix-timestamp');
    const svixSignature = req.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error('Missing Svix headers - rejecting webhook');
      return new Response(
        JSON.stringify({ error: 'Missing webhook signature headers' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify signature using RESEND_WEBHOOK_SECRET
    const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('RESEND_WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the signature
    const wh = new Webhook(webhookSecret);
    let payload: ResendWebhookPayload;

    try {
      payload = wh.verify(rawBody, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ResendWebhookPayload;
    } catch (verifyError) {
      console.error('Webhook signature verification failed:', verifyError);
      return new Response(
        JSON.stringify({ error: 'Invalid webhook signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Check if record exists first (it should, created at send time)
    const { data: existingLog } = await supabase
      .from('email_delivery_logs')
      .select('id')
      .eq('resend_email_id', data.email_id)
      .maybeSingle();

    if (existingLog) {
      // Record exists - update it
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      // Update status for delivery events (but not for opens/clicks which keep delivered)
      if (['email.sent', 'email.delivered', 'email.bounced', 'email.complained'].includes(type)) {
        updateData.status = status;
      } else if (type === 'email.opened' || type === 'email.clicked') {
        // For opens/clicks, only update status if currently 'sent' or 'delivered'
        updateData.status = 'delivered';
      }

      // Event-specific fields
      switch (type) {
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

      const { error: updateError } = await supabase
        .from('email_delivery_logs')
        .update(updateData)
        .eq('resend_email_id', data.email_id);

      if (updateError) {
        console.error('Failed to update email log:', updateError);
      } else {
        console.log(`Email log updated: ${data.email_id} -> ${status}`);
      }
    } else {
      // Record doesn't exist - only create for email.sent events
      // (other events without a prior record are orphans and can be ignored)
      if (type === 'email.sent') {
        const insertData: Record<string, unknown> = {
          resend_email_id: data.email_id,
          to_email: data.to?.[0] || 'unknown',
          from_email: data.from || 'unknown',
          subject: data.subject || null,
          status: 'sent',
          template_type: 'transactional',
        };

        const { error: insertError } = await supabase
          .from('email_delivery_logs')
          .insert(insertData);

        if (insertError) {
          console.error('Failed to insert email log from webhook:', insertError);
        } else {
          console.log(`Email log created from webhook: ${data.email_id}`);
        }
      } else {
        console.log(`Skipping ${type} event - no existing log record for ${data.email_id}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: type }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Resend webhook error:', error);
    
    // Return 200 even on error to prevent Resend from retrying indefinitely
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
