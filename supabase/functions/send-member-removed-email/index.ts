/**
 * Member Removed Email Edge Function
 * 
 * Sends notification emails when a team member is removed using the Pilot template.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";
import { 
  heading, 
  paragraph, 
  spacer,
  generateWrapper 
} from '../_shared/email-template.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MemberRemovedRequest {
  email: string;
  memberName: string;
  companyName: string;
}

// =============================================================================
// EMAIL GENERATOR
// =============================================================================

function generateMemberRemovedEmail(data: { memberName: string; companyName: string; unsubscribeUrl: string }): { html: string; text: string } {
  const { memberName, companyName, unsubscribeUrl } = data;

  const content = `
    ${heading('Removed from team')}
    ${paragraph(`Hi <strong>${memberName}</strong>, you have been removed from <strong>${companyName}</strong>.`)}
    ${spacer(8)}
    ${paragraph('You no longer have access to this team\'s resources. If you believe this was a mistake, please contact your team administrator.', true)}
  `;
  
  const html = generateWrapper({
    preheaderText: `You've been removed from ${companyName}`,
    content,
    footer: 'social-unsubscribe',
    unsubscribeUrl,
  });

  const text = `Removed from team

Hi ${memberName}, you have been removed from ${companyName}.

You no longer have access to this team's resources. If you believe this was a mistake, please contact your team administrator.

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

    const { email, memberName, companyName }: MemberRemovedRequest = await req.json();

    console.log(`Sending member removed email to: ${email}, member: ${memberName}, company: ${companyName}`);

    const unsubscribeUrl = `${appUrl}/settings?tab=notifications#team-emails`;

    const { html, text } = generateMemberRemovedEmail({
      memberName,
      companyName,
      unsubscribeUrl,
    });

    const emailResponse = await resend.emails.send({
      from: "Pilot <team@getpilot.io>",
      to: [email],
      reply_to: "team@getpilot.io",
      subject: `You've been removed from ${companyName}`,
      html,
      text,
    });

    console.log("Member removed email sent successfully:", emailResponse);

    // Log security event
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        await supabase.rpc('log_security_event', {
          p_user_id: user.id,
          p_action: 'team_member_removed_email_sent',
          p_resource_type: 'team',
          p_resource_id: email,
          p_success: true,
          p_details: {
            email: email,
            member_name: memberName,
            company_name: companyName
          }
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Member removed email sent successfully",
      email: email 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-member-removed-email function:", error);
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
