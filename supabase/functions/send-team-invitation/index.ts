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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const { email, invitedBy, companyName }: TeamInvitationRequest = await req.json();

    console.log(`Sending team invitation to: ${email}, invited by: ${invitedBy}`);

    // Get the team invitation email template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', 'team_invitation')
      .eq('active', true)
      .maybeSingle();

    if (templateError || !template) {
      console.error('Error fetching email template:', templateError);
      throw new Error('Email template not found');
    }

    // Create signup URL that leads to auth page
    const signupUrl = `${Deno.env.get('SUPABASE_URL')?.replace('//', '//').replace('supabase.co', 'lovable.dev')}/auth?tab=signup&email=${encodeURIComponent(email)}`;
    
    // Replace template variables
    const subject = template.subject
      .replace('{{company_name}}', companyName || 'our team')
      .replace('{{invited_by}}', invitedBy);

    const htmlContent = template.html_content
      .replace(/\{\{invited_by\}\}/g, invitedBy)
      .replace(/\{\{company_name\}\}/g, companyName || 'our team')
      .replace(/\{\{signup_url\}\}/g, signupUrl);

    const textContent = template.text_content
      .replace(/\{\{invited_by\}\}/g, invitedBy)
      .replace(/\{\{company_name\}\}/g, companyName || 'our team')
      .replace(/\{\{signup_url\}\}/g, signupUrl);

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "Pilot Team <team@getpilot.app>",
      to: [email],
      reply_to: "team@getpilot.app",
      subject: subject,
      html: htmlContent,
      text: textContent,
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