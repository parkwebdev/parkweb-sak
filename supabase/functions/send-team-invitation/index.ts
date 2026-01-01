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

// Email design tokens
const colors = {
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  background: '#ffffff',
  surface: '#f8fafc',
  text: '#1e293b',
  textMuted: '#64748b',
  border: '#e2e8f0',
};

function generateTeamInvitationEmail(data: { invitedBy: string; companyName: string; signupUrl: string; unsubscribeUrl: string }): { html: string; text: string } {
  const { invitedBy, companyName, signupUrl, unsubscribeUrl } = data;
  const year = new Date().getFullYear();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>You're invited to join ${companyName}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; background-color: ${colors.surface}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .wrapper { width: 100%; background-color: ${colors.surface}; padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: ${colors.background}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%); padding: 32px 40px; text-align: center; }
    .logo { font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; }
    .content { padding: 40px; }
    .heading { font-size: 24px; font-weight: 600; color: ${colors.text}; margin: 0 0 16px 0; line-height: 1.3; }
    .paragraph { font-size: 16px; line-height: 1.6; color: ${colors.textMuted}; margin: 0 0 24px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; }
    .button-wrapper { text-align: center; margin: 32px 0; }
    .disclaimer { font-size: 14px; color: ${colors.textMuted}; margin-top: 32px; padding-top: 24px; border-top: 1px solid ${colors.border}; }
    .footer { background-color: ${colors.surface}; padding: 24px 40px; text-align: center; border-top: 1px solid ${colors.border}; }
    .footer p { margin: 0 0 8px 0; font-size: 13px; color: ${colors.textMuted}; }
    .footer a { color: ${colors.primary}; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .content { padding: 24px !important; }
      .header { padding: 24px !important; }
      .footer { padding: 20px 24px !important; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo">Pilot</div>
      </div>
      <div class="content">
        <h1 class="heading">You're invited to join ${companyName}</h1>
        <p class="paragraph">
          <strong>${invitedBy}</strong> has invited you to collaborate on Pilot as part of ${companyName}.
        </p>
        <p class="paragraph">
          Pilot helps teams manage conversations, leads, and customer interactions with AI-powered assistance. Join your team to get started.
        </p>
        <div class="button-wrapper">
          <a href="${signupUrl}" class="button">Accept Invitation</a>
        </div>
        <p class="disclaimer">
          If you weren't expecting this invitation, you can safely ignore this email. The invitation link will remain valid for 7 days.
        </p>
      </div>
      <div class="footer">
        <p>&copy; ${year} Pilot</p>
        <p>1020 William Blount Dr. Ste 213, Maryville, TN 37804</p>
        <p><a href="${unsubscribeUrl}">Manage notification preferences</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;

  const text = `You're invited to join ${companyName}

${invitedBy} has invited you to collaborate on Pilot as part of ${companyName}.

Pilot helps teams manage conversations, leads, and customer interactions with AI-powered assistance. Join your team to get started.

Accept your invitation: ${signupUrl}

If you weren't expecting this invitation, you can safely ignore this email. The invitation link will remain valid for 7 days.

---
© ${year} Pilot
1020 William Blount Dr. Ste 213, Maryville, TN 37804
Manage notification preferences: ${unsubscribeUrl}`;

  return { html, text };
}

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

    // Create signup URL that leads to auth page
    const signupUrl = `${appUrl}/auth?tab=signup&email=${encodeURIComponent(email)}`;
    const unsubscribeUrl = `${appUrl}/settings?tab=notifications#team-emails`;

    // Generate the email content
    const { html, text } = generateTeamInvitationEmail({
      invitedBy,
      companyName: companyName || 'your team',
      signupUrl,
      unsubscribeUrl,
    });

    // Send email using Resend
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
        // Create pending invitation record
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

        // Create notification confirming invitation was sent
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'team',
          title: 'Team Invitation Sent',
          message: `Invitation sent to ${email}`,
          data: { invited_email: email },
          read: false
        });
        console.log('Invitation sent notification created');

        // Log the invitation for security/audit purposes
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
