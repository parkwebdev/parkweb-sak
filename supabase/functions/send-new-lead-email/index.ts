/**
 * New Lead Email Edge Function
 * 
 * Sends notification emails when a new lead is captured via Ari Agent (chat widget).
 * Uses the Pilot email template.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";

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
// DESIGN TOKENS & TEMPLATE COMPONENTS
// =============================================================================

const LOGO_URL = 'https://mvaimvwdukpgvkifkfpa.supabase.co/storage/v1/object/public/Email/Pilot%20Email%20Logo%20%40%20481px.png';

const colors = {
  background: '#f5f5f5',
  card: '#ffffff',
  text: '#171717',
  textMuted: '#737373',
  border: '#e5e5e5',
  buttonBg: '#171717',
  buttonText: '#ffffff',
  dark: {
    background: '#0a0a0a',
    card: '#171717',
    text: '#fafafa',
    textMuted: '#a3a3a3',
    border: '#262626',
    buttonBg: '#fafafa',
    buttonText: '#171717',
  },
};

const fonts = {
  stack: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};

const getBaseStyles = (): string => `
  body, table, td, p, a, li, blockquote {
    -webkit-text-size-adjust: 100%;
    -ms-text-size-adjust: 100%;
  }
  table, td {
    mso-table-lspace: 0pt;
    mso-table-rspace: 0pt;
  }
  img {
    -ms-interpolation-mode: bicubic;
    border: 0;
    height: auto;
    line-height: 100%;
    outline: none;
    text-decoration: none;
  }
  
  @media (prefers-color-scheme: dark) {
    .email-bg { background-color: ${colors.dark.background} !important; }
    .email-card { background-color: ${colors.dark.card} !important; }
    .email-text { color: ${colors.dark.text} !important; }
    .email-text-muted { color: ${colors.dark.textMuted} !important; }
    .email-border { border-color: ${colors.dark.border} !important; }
    .email-btn { background-color: ${colors.dark.buttonBg} !important; }
    .email-btn-text { color: ${colors.dark.buttonText} !important; }
    .email-detail-bg { background-color: ${colors.dark.background} !important; }
  }
  
  @media only screen and (max-width: 600px) {
    .email-container { width: 100% !important; }
    .email-content { padding: 24px !important; }
  }
`;

interface WrapperOptions {
  preheaderText: string;
  content: string;
  unsubscribeUrl?: string;
}

const generateWrapper = ({ preheaderText, content, unsubscribeUrl }: WrapperOptions): string => {
  const year = new Date().getFullYear();
  
  const unsubscribeSection = unsubscribeUrl 
    ? `<p class="email-text-muted" style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.5; color: ${colors.textMuted};"><a href="${unsubscribeUrl}" style="color: ${colors.textMuted}; text-decoration: underline;">Manage notification preferences</a></p>`
    : '';
  
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Pilot</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">${getBaseStyles()}</style>
</head>
<body class="email-bg" style="margin: 0; padding: 0; width: 100%; background-color: ${colors.background}; font-family: ${fonts.stack};">
  ${preheaderText ? `<div style="display: none; font-size: 1px; color: ${colors.background}; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden;">${preheaderText}${'&nbsp;'.repeat(50)}</div>` : ''}
  
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-bg" style="background-color: ${colors.background};">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="email-container email-card" style="max-width: 600px; width: 100%; background-color: ${colors.card}; border-radius: 8px;">
          
          <!-- Header -->
          <tr>
            <td class="email-content" style="padding: 32px 40px 0 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <img src="${LOGO_URL}" alt="Pilot" width="20" height="20" style="display: block; width: 20px; height: 20px;" />
                  </td>
                  <td style="vertical-align: middle; padding-left: 6px;">
                    <span class="email-text" style="font-size: 18px; font-weight: 700; color: ${colors.text};">Pilot</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="email-content" style="padding: 32px 40px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td class="email-content email-border" style="padding: 24px 40px; border-top: 1px solid ${colors.border};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="line-height: 1;">
                <tr>
                  <td class="email-text-muted" style="font-size: 13px; color: ${colors.textMuted}; vertical-align: middle;">© ${year} Pilot</td>
                  <td style="padding: 0 12px; vertical-align: middle;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="width: 1px; height: 13px; background-color: ${colors.border};"></td></tr></table>
                  </td>
                  <td style="vertical-align: middle;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                      <td style="padding-right: 8px;">
                        <a href="https://www.linkedin.com/company/getpilot" target="_blank" style="display: block; line-height: 0;">
                          <img src="https://mvaimvwdukpgvkifkfpa.supabase.co/storage/v1/object/public/Email/LinkedIn%20Icon@4x.png" alt="LinkedIn" height="14" style="display: block; height: 14px; width: auto;" />
                        </a>
                      </td>
                      <td>
                        <a href="https://www.facebook.com/getpilot" target="_blank" style="display: block; line-height: 0;">
                          <img src="https://mvaimvwdukpgvkifkfpa.supabase.co/storage/v1/object/public/Email/Facebook%20Icon@4x.png" alt="Facebook" height="14" style="display: block; height: 14px; width: auto;" />
                        </a>
                      </td>
                    </tr></table>
                  </td>
                </tr>
              </table>
              ${unsubscribeSection}
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const heading = (text: string): string => `
  <h1 class="email-text" style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; line-height: 1.3; color: ${colors.text};">${text}</h1>
`;

const paragraph = (text: string, muted = false): string => {
  const color = muted ? colors.textMuted : colors.text;
  const className = muted ? 'email-text-muted' : 'email-text';
  return `<p class="${className}" style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: ${color};">${text}</p>`;
};

const button = (text: string, url: string): string => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td class="email-btn" style="border-radius: 6px; background-color: ${colors.buttonBg};">
        <a href="${url}" target="_blank" class="email-btn-text" style="display: inline-block; font-family: ${fonts.stack}; font-size: 14px; font-weight: 600; color: ${colors.buttonText}; text-decoration: none; padding: 12px 24px; border-radius: 6px;">${text}</a>
      </td>
    </tr>
  </table>
`;

const spacer = (height = 24): string => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr><td style="height: ${height}px; font-size: 0; line-height: 0;">&nbsp;</td></tr>
  </table>
`;

const detailRow = (label: string, value: string): string => `
  <tr>
    <td class="email-text-muted" style="padding: 8px 0; font-size: 14px; color: ${colors.textMuted}; width: 100px; vertical-align: top;">${label}</td>
    <td class="email-text" style="padding: 8px 0; font-size: 14px; color: ${colors.text}; font-weight: 500;">${value}</td>
  </tr>
`;

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
    detailRow('Name', leadName),
    leadEmail ? detailRow('Email', leadEmail) : '',
    leadPhone ? detailRow('Phone', leadPhone) : '',
    detailRow('Source', source),
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
