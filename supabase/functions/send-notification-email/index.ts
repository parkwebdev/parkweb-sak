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
  type: 'scope_work' | 'onboarding' | 'system' | 'team' | 'security';
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
      from: "Pilot Team <team@getpilot.io>",
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

  // Customize based on notification type
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

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 40px 20px; background-color: #f5f5f5;">
      <div style="background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 8px; overflow: hidden;">
        
        <!-- Header with Logo -->
        <div style="background-color: #ffffff; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e0e0e0;">
          <div style="text-align: center;">
            <img src="https://mvaimvwdukpgvkifkfpa.supabase.co/storage/v1/object/public/email-assets/pilot-logo.png" alt="Pilot Logo" style="width: 60px; height: 60px; border-radius: 8px;" />
          </div>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <p style="font-size: 14px; margin-bottom: 20px; color: #333333;"><strong>${title}</strong></p>
          
          <p style="font-size: 14px; margin-bottom: 24px; color: #333333; line-height: 1.6;">${message}</p>
          
          ${data?.additionalInfo ? `
            <p style="font-size: 14px; margin-bottom: 24px; color: #333333; line-height: 1.6;"><strong>Additional Details:</strong><br>${data.additionalInfo}</p>
          ` : ''}

          <p style="font-size: 14px; margin-bottom: 30px; color: #333333; line-height: 1.6;">Click the button below to view more details or take action on this notification.</p>
          
          <!-- Action Button - Left Aligned -->
          <div style="text-align: left; margin: 30px 0;">
            <a href="${actionUrl}" style="background-color: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; display: inline-block;">${actionText}</a>
          </div>
          
          <p style="font-size: 14px; color: #333333; line-height: 1.6;">If you have any questions, feel free to reach out to us directly.</p>
          
          <!-- Timestamp -->
          <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
            <p style="color: #666666; font-size: 12px; margin: 0;">
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
        
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}


serve(handler);