/**
 * Notification Email Edge Function
 * 
 * Sends notification emails using the professional Pilot template.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting storage
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX_REQUESTS = 10;

interface EmailRequest {
  to: string;
  type: 'scope_work' | 'onboarding' | 'system' | 'team' | 'security';
  title: string;
  message: string;
  data?: any;
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
// VALIDATION HELPERS
// =============================================================================

const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }
  
  const trimmed = email.trim();
  if (trimmed.length > 254) {
    return { isValid: false, error: 'Email too long' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  return { isValid: true };
};

const validateText = (text: string, fieldName: string, maxLength = 500): { isValid: boolean; sanitized: string; error?: string } => {
  if (!text || typeof text !== 'string') {
    return { isValid: false, sanitized: '', error: `${fieldName} is required` };
  }
  
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { isValid: false, sanitized: '', error: `${fieldName} cannot be empty` };
  }
  
  if (trimmed.length > maxLength) {
    return { isValid: false, sanitized: '', error: `${fieldName} too long (max ${maxLength} characters)` };
  }
  
  const sanitized = trimmed.replace(/<[^>]*>/g, '');
  
  return { isValid: true, sanitized };
};

const validateType = (type: string): { isValid: boolean; error?: string } => {
  const allowedTypes = ['scope_work', 'onboarding', 'system', 'team', 'security'];
  if (!allowedTypes.includes(type)) {
    return { isValid: false, error: 'Invalid notification type' };
  }
  return { isValid: true };
};

const checkRateLimit = (clientIP: string): boolean => {
  const now = Date.now();
  const clientData = rateLimitMap.get(clientIP);
  
  if (!clientData || now > clientData.resetTime) {
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  clientData.count++;
  return true;
};

const sanitizeData = (data: any): any => {
  if (!data) return data;
  
  if (typeof data === 'string') {
    return data.replace(/<[^>]*>/g, '').trim();
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        sanitized[key] = value.replace(/<[^>]*>/g, '').trim();
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
  
  return data;
};

// =============================================================================
// EMAIL GENERATOR
// =============================================================================

function generateEmailContent(
  type: string,
  title: string,
  message: string,
  data?: any
): { subject: string; html: string } {
  const baseUrl = Deno.env.get('APP_URL') || 'https://getpilot.io';
  
  let subject = `Pilot: ${title}`;
  let actionUrl = baseUrl;
  let actionText = "View Dashboard";

  switch (type) {
    case 'scope_work':
      actionUrl = `${baseUrl}/scope-of-works`;
      actionText = "View Scope of Works";
      if (data?.sowId) {
        actionUrl += `?id=${data.sowId}`;
      }
      break;
    case 'onboarding':
      actionUrl = `${baseUrl}/onboarding`;
      actionText = "View Onboarding";
      break;
    case 'team':
      actionUrl = `${baseUrl}/team`;
      actionText = "View Team";
      break;
    case 'system':
    case 'security':
      actionUrl = `${baseUrl}/settings`;
      actionText = "View Settings";
      break;
  }

  const additionalDetails = data?.additionalInfo 
    ? `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-bg" style="background-color: ${colors.background}; border-radius: 8px; margin-bottom: 16px;">
        <tr>
          <td style="padding: 16px;">
            <p class="email-text" style="margin: 0; font-size: 14px; line-height: 1.6; color: ${colors.text};">${data.additionalInfo}</p>
          </td>
        </tr>
      </table>
    `
    : '';

  const content = `
    ${heading(title)}
    ${paragraph(message)}
    ${additionalDetails}
    ${spacer(8)}
    ${button(actionText, actionUrl)}
    ${spacer(16)}
    ${paragraph(`Sent on ${new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    })}`, true)}
  `;

  const html = generateWrapper(title, content);

  return { subject, html };
}

// =============================================================================
// HANDLER
// =============================================================================

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    if (!checkRateLimit(clientIP)) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    let emailRequest: EmailRequest;
    try {
      emailRequest = await req.json();
    } catch (error) {
      console.error('Invalid JSON in request body:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Email request received:", emailRequest);

    const { to, type, title, message, data } = emailRequest;

    const emailValidation = validateEmail(to);
    if (!emailValidation.isValid) {
      return new Response(
        JSON.stringify({ error: emailValidation.error }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const typeValidation = validateType(type);
    if (!typeValidation.isValid) {
      return new Response(
        JSON.stringify({ error: typeValidation.error }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const titleValidation = validateText(title, 'Title', 200);
    if (!titleValidation.isValid) {
      return new Response(
        JSON.stringify({ error: titleValidation.error }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const messageValidation = validateText(message, 'Message', 1000);
    if (!messageValidation.isValid) {
      return new Response(
        JSON.stringify({ error: messageValidation.error }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const sanitizedTo = to.trim().toLowerCase();
    const sanitizedTitle = titleValidation.sanitized;
    const sanitizedMessage = messageValidation.sanitized;
    const sanitizedData = sanitizeData(data);

    const emailContent = generateEmailContent(type, sanitizedTitle, sanitizedMessage, sanitizedData);

    const emailResponse = await resend.emails.send({
      from: "Pilot <team@getpilot.io>",
      to: [sanitizedTo],
      reply_to: "team@getpilot.io",
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (emailResponse.error) {
      console.error("Resend API error:", emailResponse.error);
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Unexpected error in send-notification-email function:", error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
