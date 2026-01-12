/**
 * Pilot Team Invitation Email Edge Function
 * 
 * Sends team invitation emails for the internal Pilot admin team.
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
import { getErrorMessage } from '../_shared/errors.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PilotTeamInvitationRequest {
  firstName: string;
  lastName?: string;
  email: string;
  role: 'super_admin' | 'pilot_support';
  invitedBy: string;
}

// Role display names for the email
const ROLE_DISPLAY_NAMES: Record<string, string> = {
  super_admin: 'Super Admin',
  pilot_support: 'Pilot Support',
};

// =============================================================================
// EMAIL GENERATOR
// =============================================================================

function generatePilotTeamInvitationEmail(data: { 
  inviteeName: string; 
  invitedBy: string; 
  role: string;
  roleDescription: string;
  signupUrl: string; 
  unsubscribeUrl: string; 
}): { html: string; text: string } {
  const { inviteeName, invitedBy, role, roleDescription, signupUrl, unsubscribeUrl } = data;

  const greeting = inviteeName ? `Hi ${inviteeName},` : 'Hi there,';

  const content = `
    ${heading("You're invited to join the Pilot Team")}
    ${paragraph(greeting)}
    ${paragraph(`<strong>${invitedBy}</strong> has invited you to join the Pilot admin team as a <strong>${role}</strong>.`)}
    ${paragraph(roleDescription, true)}
    ${spacer(8)}
    ${button('Accept Invitation', signupUrl)}
    ${spacer(24)}
    ${paragraph("If you weren't expecting this invitation, you can safely ignore this email.", true)}
  `;
  
  const html = generateWrapper({
    preheaderText: `${invitedBy} invited you to join the Pilot admin team`,
    content,
    footer: 'social-unsubscribe',
    unsubscribeUrl,
  });

  const text = `You're invited to join the Pilot Team

${greeting}

${invitedBy} has invited you to join the Pilot admin team as a ${role}.

${roleDescription}

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

    // Verify the caller is a super_admin
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required', success: false }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication', success: false }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if caller is super_admin
    const { data: callerRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .single();

    if (!callerRole) {
      return new Response(
        JSON.stringify({ error: 'Only super admins can invite Pilot team members', success: false }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { firstName, lastName, email, role, invitedBy }: PilotTeamInvitationRequest = await req.json();

    console.log(`Sending Pilot team invitation to: ${email} (${firstName} ${lastName || ''}), role: ${role}, invited by: ${invitedBy}`);

    // Build the invitee's full name for display
    const inviteeName = firstName + (lastName ? ` ${lastName}` : '');

    // Role descriptions for the email
    const roleDescriptions: Record<string, string> = {
      super_admin: 'As a Super Admin, you\'ll have full access to all platform features, account management, and system settings.',
      pilot_support: 'As Pilot Support, you\'ll have view access to accounts, content, and analytics to help assist customers.',
    };

    // Include first and last name in the signup URL for pre-filling
    const signupUrl = `${appUrl}/login?tab=signup&email=${encodeURIComponent(email)}&firstName=${encodeURIComponent(firstName)}${lastName ? `&lastName=${encodeURIComponent(lastName)}` : ''}`;
    const unsubscribeUrl = `${appUrl}/settings?tab=notifications#team-emails`;

    const { html, text } = generatePilotTeamInvitationEmail({
      inviteeName: firstName,
      invitedBy,
      role: ROLE_DISPLAY_NAMES[role] || role,
      roleDescription: roleDescriptions[role] || '',
      signupUrl,
      unsubscribeUrl,
    });

    const emailResponse = await resend.emails.send({
      from: "Pilot <team@getpilot.io>",
      to: [email],
      reply_to: "team@getpilot.io",
      subject: `${invitedBy} invited you to join the Pilot Team`,
      html,
      text,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'Precedence': 'bulk',
        'X-Auto-Response-Suppress': 'All',
      },
    });

    console.log("Pilot team invitation email sent successfully:", emailResponse);

    // Store the pending invitation in the database
    const { error: pendingError } = await supabase
      .from('pending_invitations')
      .insert({
        email: email,
        invited_by: user.id,
        invited_by_name: invitedBy,
        company_name: 'Pilot',
        invited_first_name: firstName,
        invited_last_name: lastName || null,
        is_pilot_invite: true,
        pilot_role: role,
        status: 'pending'
      });

    if (pendingError) {
      console.error('Error creating pending invitation:', pendingError);
      // Don't fail the request, email was still sent
    }

    // Create notification for the inviting admin
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'team',
      title: 'Pilot Team Invitation Sent',
      message: `Invitation sent to ${inviteeName} (${email}) as ${ROLE_DISPLAY_NAMES[role]}`,
      data: { 
        invited_email: email, 
        invited_name: inviteeName,
        role: role,
        is_pilot_invite: true
      },
      read: false
    });

    // Log to admin audit log
    await supabase.from('admin_audit_log').insert({
      admin_user_id: user.id,
      action: 'team_invite',
      target_type: 'team',
      target_email: email,
      details: {
        invited_name: inviteeName,
        invited_role: role,
        is_pilot_invite: true
      }
    });

    console.log('Pilot team invitation logged to audit log');

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Pilot team invitation sent successfully",
      email: email 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: unknown) {
    console.error("Error in send-pilot-team-invitation function:", error);
    return new Response(
      JSON.stringify({ 
        error: getErrorMessage(error),
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
