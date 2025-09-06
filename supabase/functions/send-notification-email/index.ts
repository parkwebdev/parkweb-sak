import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  type: 'scope_work' | 'onboarding' | 'system' | 'team';
  title: string;
  message: string;
  data?: any;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const emailRequest: EmailRequest = await req.json();
    console.log("Email request received:", emailRequest);

    const { to, type, title, message, data } = emailRequest;

    if (!to || !title || !message) {
      throw new Error("Missing required fields: to, title, or message");
    }

    // Generate email content based on notification type
    const emailContent = generateEmailContent(type, title, message, data);

    const emailResponse = await resend.emails.send({
      from: "Agency <notifications@lovable.app>", // You'll need to configure this domain in Resend
      to: [to],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-notification-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
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