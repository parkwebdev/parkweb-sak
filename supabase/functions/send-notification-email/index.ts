import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Rate limiting storage
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 emails per minute per IP

interface EmailRequest {
  to: string;
  type: 'scope_work' | 'onboarding' | 'system' | 'team';
  title: string;
  message: string;
  data?: any;
}

// Input validation functions
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
  
  // Basic sanitization - remove potential HTML tags
  const sanitized = trimmed.replace(/<[^>]*>/g, '');
  
  return { isValid: true, sanitized };
};

const validateType = (type: string): { isValid: boolean; error?: string } => {
  const allowedTypes = ['scope_work', 'onboarding', 'system', 'team'];
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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    // Check rate limit
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

    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Parse and validate request body
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

    // Validate all required fields
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

    // Sanitize input data
    const sanitizedTo = to.trim().toLowerCase();
    const sanitizedTitle = titleValidation.sanitized;
    const sanitizedMessage = messageValidation.sanitized;
    const sanitizedData = sanitizeData(data);

    // Generate email content based on notification type
    const emailContent = generateEmailContent(type, sanitizedTitle, sanitizedMessage, sanitizedData);

    const emailResponse = await resend.emails.send({
      from: "Agency <notifications@lovable.app>", // You'll need to configure this domain in Resend
      to: [sanitizedTo],
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

function generateEmailContent(
  type: string,
  title: string,
  message: string,
  data?: any
): { subject: string; html: string } {
  const baseUrl = Deno.env.get('SITE_URL') || 'https://lovable.app';
  
  let subject = `Agency Notification: ${title}`;
  let actionUrl = baseUrl;
  let actionText = "View Dashboard";
  let backgroundColor = "#3b82f6"; // blue
  let emoji = "📢";

  // Customize based on notification type
  switch (type) {
    case 'scope_work':
      emoji = "📄";
      actionUrl = `${baseUrl}/scope-of-works`;
      actionText = "View Scope of Works";
      backgroundColor = "#10b981"; // green
      if (data?.sowId) {
        actionUrl += `?id=${data.sowId}`;
      }
      break;
    case 'onboarding':
      emoji = "👋";
      actionUrl = `${baseUrl}/onboarding`;
      actionText = "View Onboarding";
      backgroundColor = "#8b5cf6"; // purple
      break;
    case 'team':
      emoji = "👥";
      actionUrl = `${baseUrl}/team`;
      actionText = "View Team";
      backgroundColor = "#f59e0b"; // amber
      break;
    case 'system':
      emoji = "⚙️";
      actionUrl = `${baseUrl}/settings`;
      actionText = "View Settings";
      backgroundColor = "#ef4444"; // red
      break;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${backgroundColor} 0%, ${adjustColor(backgroundColor, -20)} 100%); padding: 32px 24px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 8px;">${emoji}</div>
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">${title}</h1>
        </div>

        <!-- Content -->
        <div style="padding: 32px 24px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            ${message}
          </p>

          ${data?.additionalInfo ? `
            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                <strong>Additional Details:</strong><br>
                ${data.additionalInfo}
              </p>
            </div>
          ` : ''}

          <!-- Action Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${actionUrl}" 
               style="display: inline-block; background-color: ${backgroundColor}; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 16px;">
              ${actionText}
            </a>
          </div>

          <!-- Timestamp -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
              Sent on ${new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">
            You're receiving this because you have notifications enabled in your Agency account.
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            <a href="${baseUrl}/settings" style="color: #6b7280; text-decoration: none;">Manage notification preferences</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

// Helper function to adjust color brightness
function adjustColor(color: string, amount: number): string {
  // Simple color adjustment - in production you might want a more robust solution
  const colorMap: { [key: string]: string } = {
    '#3b82f6': amount > 0 ? '#60a5fa' : '#1d4ed8', // blue
    '#10b981': amount > 0 ? '#34d399' : '#047857', // green  
    '#8b5cf6': amount > 0 ? '#a78bfa' : '#6d28d9', // purple
    '#f59e0b': amount > 0 ? '#fbbf24' : '#d97706', // amber
    '#ef4444': amount > 0 ? '#f87171' : '#dc2626', // red
  };
  
  return colorMap[color] || color;
}

serve(handler);