/**
 * Notification Email Edge Function
 * 
 * Sends notification emails using the professional Pilot template.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { 
  colors,
  heading, 
  paragraph, 
  button, 
  spacer,
  generateWrapper 
} from '../_shared/email-template.ts';

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

  const html = generateWrapper({
    preheaderText: title,
    content,
    footer: 'simple',
  });

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
