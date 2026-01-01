/**
 * Auth Email Edge Function
 * 
 * Sends custom authentication-related emails using our branded templates.
 * Supports: password-reset, email-verification, welcome
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

const generateWrapper = (preheaderText: string, content: string): string => {
  const year = new Date().getFullYear();
  
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
// EMAIL GENERATORS
// =============================================================================

function generatePasswordResetEmail(userName: string | undefined, resetUrl: string, expiresIn = '1 hour'): string {
  const greeting = userName ? `Hi ${userName},` : 'Hi,';
  
  const content = `
    ${heading('Reset your password')}
    ${paragraph(`${greeting} we received a request to reset your password.`)}
    ${paragraph('Click the button below to choose a new password:', true)}
    ${spacer(8)}
    ${button('Reset Password', resetUrl)}
    ${spacer(24)}
    ${paragraph(`This link will expire in ${expiresIn}.`, true)}
    ${paragraph("If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.", true)}
  `;
  
  return generateWrapper('Reset your Pilot password', content);
}

function generateEmailVerificationEmail(userName: string | undefined, verificationUrl: string, expiresIn = '24 hours'): string {
  const greeting = userName ? `Welcome ${userName}!` : 'Welcome!';
  
  const content = `
    ${heading('Verify your email')}
    ${paragraph(`${greeting} Thanks for signing up for Pilot. Please verify your email address to get started.`)}
    ${spacer(8)}
    ${button('Verify Email', verificationUrl)}
    ${spacer(24)}
    ${paragraph(`This link will expire in ${expiresIn}.`, true)}
    ${paragraph("If you didn't create a Pilot account, you can safely ignore this email.", true)}
  `;
  
  return generateWrapper('Verify your email to get started with Pilot', content);
}

function generateWelcomeEmail(userName: string, companyName: string | undefined, getStartedUrl: string): string {
  const companyNote = companyName ? ` We're excited to have ${companyName} on board.` : '';
  
  const content = `
    ${heading(`Welcome to Pilot, ${userName}!`)}
    ${paragraph(`Thanks for joining Pilot.${companyNote}`)}
    ${paragraph('Pilot helps you manage conversations, capture leads, and provide AI-powered customer support—all in one place.', true)}
    
    <!-- Quick Start -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-bg" style="background-color: ${colors.background}; border-radius: 8px;">
      <tr>
        <td style="padding: 20px;">
          <p class="email-text" style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: ${colors.text};">Get started in 3 steps:</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td class="email-text" style="padding: 8px 0; font-size: 14px; color: ${colors.text};">1. Set up your AI agent</td></tr>
            <tr><td class="email-text" style="padding: 8px 0; font-size: 14px; color: ${colors.text};">2. Add your knowledge base</td></tr>
            <tr><td class="email-text" style="padding: 8px 0; font-size: 14px; color: ${colors.text};">3. Install the widget on your site</td></tr>
          </table>
        </td>
      </tr>
    </table>
    
    ${spacer(24)}
    ${button('Get Started', getStartedUrl)}
    ${spacer(16)}
    ${paragraph("Need help? Reply to this email and we'll get back to you.", true)}
  `;
  
  return generateWrapper(`Welcome to Pilot, ${userName}! Let's get you set up.`, content);
}

// =============================================================================
// REQUEST TYPES & HANDLER
// =============================================================================

interface AuthEmailRequest {
  type: 'password-reset' | 'email-verification' | 'welcome';
  to: string;
  userName?: string;
  companyName?: string;
  actionUrl: string;
  expiresIn?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: AuthEmailRequest = await req.json();
    const { type, to, userName, companyName, actionUrl, expiresIn } = body;

    console.log(`[send-auth-email] Sending ${type} email to ${to}`);

    if (!type || !to || !actionUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: type, to, actionUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let html: string;
    let subject: string;

    switch (type) {
      case 'password-reset':
        html = generatePasswordResetEmail(userName, actionUrl, expiresIn);
        subject = 'Reset your password';
        break;
      case 'email-verification':
        html = generateEmailVerificationEmail(userName, actionUrl, expiresIn);
        subject = 'Verify your email address';
        break;
      case 'welcome':
        html = generateWelcomeEmail(userName || 'there', companyName, actionUrl);
        subject = `Welcome to Pilot${userName ? `, ${userName}` : ''}!`;
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Unknown email type: ${type}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const emailResponse = await resend.emails.send({
      from: "Pilot <team@getpilot.io>",
      to: [to],
      subject,
      html,
    });

    console.log(`[send-auth-email] Email sent successfully:`, emailResponse);

    return new Response(
      JSON.stringify({ success: true, id: emailResponse.data?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[send-auth-email] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
