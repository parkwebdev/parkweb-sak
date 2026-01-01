/**
 * New Lead Email Edge Function
 * 
 * Sends notification emails when a new lead is captured via Ari Agent (chat widget).
 * Uses the Pilot email template.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";
import { 
  colors,
  heading, 
  paragraph, 
  button, 
  spacer, 
  detailRow,
  generateWrapper 
} from '../_shared/email-template.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewLeadEmailRequest {
  recipientEmail: string;
  leadName: string;
  leadEmail?: string;
  leadPhone?: string;
  message?: string;
  leadId: string;
  conversationId?: string;
}

// =============================================================================
// EMAIL GENERATOR
// =============================================================================

function generateNewLeadEmail(data: {
  leadName: string;
  leadEmail?: string;
  leadPhone?: string;
  message?: string;
  viewLeadUrl: string;
  unsubscribeUrl: string;
}): { html: string; text: string } {
  const { leadName, leadEmail, leadPhone, message, viewLeadUrl, unsubscribeUrl } = data;
  const source = 'Ari Agent';

  const leadCardRows = [
    detailRow('Name', leadName, 100),
    leadEmail ? detailRow('Email', leadEmail, 100) : '',
    leadPhone ? detailRow('Phone', leadPhone, 100) : '',
    detailRow('Source', source, 100),
  ].filter(Boolean).join('');

  const messageSection = message 
    ? `${spacer(16)}<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${colors.background}; border-radius: 8px; border-left: 4px solid ${colors.border};">
        <tr>
          <td style="padding: 16px;">
            <p class="email-text" style="margin: 0; font-size: 14px; font-style: italic; line-height: 1.5; color: ${colors.text};">"${message}"</p>
          </td>
        </tr>
      </table>`
    : '';

  const content = `
    ${heading('You have a new lead')}
    ${paragraph('View the lead to see more details.')}
    
    <!-- Lead Card -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-detail-bg email-bg" style="background-color: ${colors.background}; border-radius: 8px;">
      <tr>
        <td style="padding: 20px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${leadCardRows}
          </table>
        </td>
      </tr>
    </table>
    ${messageSection}
    ${spacer(24)}
    ${button('View Lead', viewLeadUrl)}
  `;
  
  const html = generateWrapper({
    preheaderText: `New lead: ${leadName} from ${source}`,
    content,
    footer: 'social-unsubscribe',
    unsubscribeUrl,
  });

  const text = `You have a new lead

View the lead to see more details.

Name: ${leadName}
${leadEmail ? `Email: ${leadEmail}` : ''}
${leadPhone ? `Phone: ${leadPhone}` : ''}
Source: ${source}
${message ? `\nMessage: "${message}"` : ''}

View Lead: ${viewLeadUrl}

---
© ${new Date().getFullYear()} Pilot
Manage notification preferences: ${unsubscribeUrl}`;

  return { html, text };
}

// =============================================================================
// HANDLER
// =============================================================================

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const appUrl = Deno.env.get("APP_URL") || "https://getpilot.io";

    const { 
      recipientEmail, 
      leadName, 
      leadEmail, 
      leadPhone, 
      message, 
      leadId 
    }: NewLeadEmailRequest = await req.json();

    console.log(`Sending new lead email to: ${recipientEmail}, lead: ${leadName}, id: ${leadId}`);

    // Validate required fields
    if (!recipientEmail || !leadName || !leadId) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: recipientEmail, leadName, leadId' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const viewLeadUrl = `${appUrl}/leads?id=${leadId}`;
    const unsubscribeUrl = `${appUrl}/settings?tab=notifications#lead-emails`;

    const { html, text } = generateNewLeadEmail({
      leadName,
      leadEmail,
      leadPhone,
      message,
      viewLeadUrl,
      unsubscribeUrl,
    });

    const emailResponse = await resend.emails.send({
      from: "Pilot <leads@getpilot.io>",
      to: [recipientEmail],
      reply_to: leadEmail || "team@getpilot.io",
      subject: `New lead: ${leadName} via Ari Agent`,
      html,
      text,
    });

    console.log("New lead email sent successfully:", emailResponse);

    // Log security event
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        await supabase.rpc('log_security_event', {
          p_user_id: user.id,
          p_action: 'new_lead_email_sent',
          p_resource_type: 'lead',
          p_resource_id: leadId,
          p_success: true,
          p_details: {
            recipient: recipientEmail,
            lead_name: leadName,
            lead_email: leadEmail
          }
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "New lead email sent successfully",
      leadId 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-new-lead-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
