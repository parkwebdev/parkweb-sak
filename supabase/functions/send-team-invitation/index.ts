/**
 * Team Invitation Email Edge Function
 * 
 * Sends team invitation emails using the professional Pilot template.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TeamInvitationRequest {
  email: string;
  invitedBy: string;
  companyName?: string;
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
                    <img src="${LOGO_URL}" alt="Pilot" width="28" height="28" style="display: block; width: 28px; height: 28px;" />
                  </td>
                  <td style="vertical-align: middle; padding-left: 10px;">
                    <span class="email-text" style="font-size: 18px; font-weight: 600; color: ${colors.text};">Pilot</span>
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
              <p class="email-text-muted" style="margin: 0; font-size: 13px; line-height: 1.5; color: ${colors.textMuted};">© ${year} Pilot</p>
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

// =============================================================================
// EMAIL GENERATOR
// =============================================================================

function generateTeamInvitationEmail(data: { invitedBy: string; companyName: string; signupUrl: string; unsubscribeUrl: string }): { html: string; text: string } {
  const { invitedBy, companyName, signupUrl, unsubscribeUrl } = data;

  const content = `
    ${heading(`You're invited to join ${companyName}`)}
    ${paragraph(`<strong>${invitedBy}</strong> has invited you to collaborate on Pilot as part of ${companyName}.`)}
    ${paragraph('Pilot helps teams manage conversations, leads, and customer interactions with AI-powered assistance.', true)}
    ${spacer(8)}
    ${button('Accept Invitation', signupUrl)}
    ${spacer(24)}
    ${paragraph("If you weren't expecting this invitation, you can safely ignore this email.", true)}
  `;
  
  const html = generateWrapper({
    preheaderText: `${invitedBy} invited you to join ${companyName} on Pilot`,
    content,
    unsubscribeUrl,
  });

  const text = `You're invited to join ${companyName}

${invitedBy} has invited you to collaborate on Pilot as part of ${companyName}.

Pilot helps teams manage conversations, leads, and customer interactions with AI-powered assistance. Join your team to get started.

Accept your invitation: ${signupUrl}

If you weren't expecting this invitation, you can safely ignore this email.

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

    const { email, invitedBy, companyName }: TeamInvitationRequest = await req.json();

    console.log(`Sending team invitation to: ${email}, invited by: ${invitedBy}`);

    const signupUrl = `${appUrl}/auth?tab=signup&email=${encodeURIComponent(email)}`;
    const unsubscribeUrl = `${appUrl}/settings?tab=notifications#team-emails`;

    const { html, text } = generateTeamInvitationEmail({
      invitedBy,
      companyName: companyName || 'your team',
      signupUrl,
      unsubscribeUrl,
    });

    const emailResponse = await resend.emails.send({
      from: "Pilot <team@getpilot.io>",
      to: [email],
      reply_to: "team@getpilot.io",
      subject: `${invitedBy} invited you to join ${companyName || 'their team'} on Pilot`,
      html,
      text,
    });

    console.log("Team invitation email sent successfully:", emailResponse);

    // Store the pending invitation in the database
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        const { error: pendingError } = await supabase
          .from('pending_invitations')
          .insert({
            email: email,
            invited_by: user.id,
            invited_by_name: invitedBy,
            company_name: companyName,
            status: 'pending'
          });

        if (pendingError) {
          console.error('Error creating pending invitation:', pendingError);
        }

        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'team',
          title: 'Team Invitation Sent',
          message: `Invitation sent to ${email}`,
          data: { invited_email: email },
          read: false
        });
        console.log('Invitation sent notification created');

        await supabase.rpc('log_security_event', {
          p_user_id: user.id,
          p_action: 'team_invitation_sent',
          p_resource_type: 'team',
          p_resource_id: email,
          p_success: true,
          p_details: {
            email: email,
            invited_by: invitedBy,
            company_name: companyName
          }
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Team invitation sent successfully",
      email: email 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-team-invitation function:", error);
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
