/**
 * Auth Email Edge Function
 * 
 * Sends custom authentication-related emails using our branded templates.
 * 
 * NOTE: Supabase handles password-reset and signup-confirmation emails natively.
 * This function is only for the 'welcome' email sent after user confirms their account.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
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

// =============================================================================
// EMAIL GENERATOR
// =============================================================================

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
  
  return generateWrapper({
    preheaderText: `Welcome to Pilot, ${userName}! Let's get you set up.`,
    content,
    footer: 'social',
  });
}

// =============================================================================
// REQUEST TYPES & HANDLER
// =============================================================================

interface AuthEmailRequest {
  type: 'welcome';
  to: string;
  userName?: string;
  companyName?: string;
  actionUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: AuthEmailRequest = await req.json();
    const { type, to, userName, companyName, actionUrl } = body;

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
      case 'welcome':
        html = generateWelcomeEmail(userName || 'there', companyName, actionUrl);
        subject = `Welcome to Pilot${userName ? `, ${userName}` : ''}!`;
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Unknown email type: ${type}. Only 'welcome' is supported. Supabase handles password-reset and signup-confirmation.` }),
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
