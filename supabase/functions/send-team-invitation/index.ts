/**
 * Team Invitation Email Edge Function
 * 
 * Sends team invitation emails using the professional Pilot template.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";
import { 
  heading, 
  paragraph, 
  button, 
  spacer,
  generateWrapper 
} from '../_shared/email-template.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TeamInvitationRequest {
  firstName: string;
  lastName?: string;
  email: string;
  invitedBy: string;
  companyName?: string;
}

// =============================================================================
// EMAIL GENERATOR
// =============================================================================

function generateTeamInvitationEmail(data: { 
  inviteeName: string; 
  invitedBy: string; 
  companyName: string; 
  signupUrl: string; 
  unsubscribeUrl: string; 
}): { html: string; text: string } {
  const { inviteeName, invitedBy, companyName, signupUrl, unsubscribeUrl } = data;

  // Personalize greeting with invitee's name
  const greeting = inviteeName ? `Hi ${inviteeName},` : 'Hi there,';

  const content = `
    ${heading(`You're invited to join ${companyName}`)}
    ${paragraph(greeting)}
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
    footer: 'social-unsubscribe',
    unsubscribeUrl,
  });

  const text = `You're invited to join ${companyName}

${greeting}

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

    const { firstName, lastName, email, invitedBy, companyName }: TeamInvitationRequest = await req.json();

    console.log(`Sending team invitation to: ${email} (${firstName} ${lastName || ''}), invited by: ${invitedBy}`);

    // Build the invitee's full name for display
    const inviteeName = firstName + (lastName ? ` ${lastName}` : '');

    // Include first and last name in the signup URL for pre-filling
    const signupUrl = `${appUrl}/login?tab=signup&email=${encodeURIComponent(email)}&firstName=${encodeURIComponent(firstName)}${lastName ? `&lastName=${encodeURIComponent(lastName)}` : ''}`;
    const unsubscribeUrl = `${appUrl}/settings?tab=notifications#team-emails`;

    const { html, text } = generateTeamInvitationEmail({
      inviteeName: firstName, // Use first name for greeting
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
            invited_first_name: firstName,
            invited_last_name: lastName || null,
            status: 'pending'
          });

        if (pendingError) {
          console.error('Error creating pending invitation:', pendingError);
        }

        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'team',
          title: 'Team Invitation Sent',
          message: `Invitation sent to ${inviteeName} (${email})`,
          data: { invited_email: email, invited_name: inviteeName },
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
            invited_name: inviteeName,
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
