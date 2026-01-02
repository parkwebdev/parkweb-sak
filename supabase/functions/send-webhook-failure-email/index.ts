import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  generateWrapper,
  heading,
  paragraph,
  button,
  spacer,
  detailRow,
  alertBox,
  colors,
} from "../_shared/email-template.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookFailureEmailRequest {
  recipientEmail: string;
  webhookId: string;
  webhookName: string;
  endpoint: string;
  errorCode: number;
  errorMessage: string;
  retryCount: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      recipientEmail,
      webhookId,
      webhookName,
      endpoint,
      errorCode,
      errorMessage,
      retryCount,
    }: WebhookFailureEmailRequest = await req.json();

    // Validate required fields
    if (!recipientEmail || !webhookId || !webhookName || !endpoint) {
      console.error("[send-webhook-failure-email] Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[send-webhook-failure-email] Sending failure notification for webhook: ${webhookName} to ${recipientEmail}`);

    const APP_URL = Deno.env.get("APP_URL") || "https://app.getpilot.co";
    const configureUrl = `${APP_URL}/settings/integrations`;
    const failedAt = new Date().toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });

    // Build email content using shared primitives
    const content = `
      ${heading("Webhook delivery failed")}
      ${alertBox(`Your webhook "${webhookName}" failed to deliver after ${retryCount} ${retryCount === 1 ? 'attempt' : 'attempts'}. Please check the endpoint and try again.`, 'error')}
      ${spacer(24)}
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-detail-bg" style="background-color: ${colors.background}; border-radius: 6px;">
        <tbody style="display: block; padding: 16px;">
          ${detailRow("Endpoint", endpoint)}
          ${detailRow("Error Code", String(errorCode))}
          ${detailRow("Failed At", failedAt)}
          ${detailRow("Retries", String(retryCount))}
        </tbody>
      </table>
      ${spacer(12)}
      <p class="email-text-muted" style="margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: ${colors.textMuted};">Error Message</p>
      <p class="email-text-error" style="margin: 0; font-size: 13px; font-family: monospace; padding: 8px; background-color: ${colors.card}; border-radius: 4px; border: 1px solid ${colors.border}; color: ${colors.error};">${errorMessage}</p>
      ${spacer(24)}
      ${button("Configure Webhook", configureUrl)}
      ${spacer(16)}
      ${paragraph("If you continue to experience issues, please check your endpoint availability and authentication settings.", true)}
    `;

    const html = generateWrapper({
      preheaderText: `Webhook "${webhookName}" failed to deliver after ${retryCount} attempts`,
      content,
      footer: 'social-unsubscribe',
      unsubscribeUrl: `${APP_URL}/settings/notifications`,
    });

    const emailResponse = await resend.emails.send({
      from: "Pilot <notifications@mail.getpilot.co>",
      to: [recipientEmail],
      subject: `Webhook failed: ${webhookName}`,
      html,
    });

    console.log(`[send-webhook-failure-email] Email sent successfully:`, emailResponse);

    // Log security event
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase.rpc("log_security_event", {
        p_user_id: null,
        p_action: "webhook_failure_email_sent",
        p_resource_type: "webhook",
        p_resource_id: webhookId,
        p_success: true,
        p_details: { recipient: recipientEmail, webhookName, errorCode },
      });
    } catch (logError) {
      console.warn("[send-webhook-failure-email] Failed to log security event:", logError);
    }

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[send-webhook-failure-email] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
