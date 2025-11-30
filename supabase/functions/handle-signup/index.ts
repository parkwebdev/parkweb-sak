import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { email, user_id }: { email: string; user_id: string } = await req.json();

    console.log(`Processing signup completion for: ${email}`);

    // Check if this email has a pending invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('pending_invitations')
      .select('*')
      .eq('email', email)
      .eq('status', 'pending')
      .maybeSingle();

    if (invitationError) {
      console.error('Error checking pending invitation:', invitationError);
    }

    if (invitation) {
      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('pending_invitations')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      if (updateError) {
        console.error('Error updating invitation status:', updateError);
      }

      // Add user to team_members table
      const { error: teamError } = await supabase
        .from('team_members')
        .insert({
          owner_id: invitation.invited_by,
          member_id: user_id,
          role: 'member'
        });

      if (teamError) {
        console.error('Error adding team member:', teamError);
      } else {
        console.log(`Added user ${user_id} to team of ${invitation.invited_by}`);
      }

      console.log(`Marked invitation as accepted for: ${email}`);

      // Log the successful signup from invitation
      await supabase.rpc('log_security_event', {
        p_user_id: user_id,
        p_action: 'team_invitation_accepted',
        p_resource_type: 'team',
        p_resource_id: email,
        p_success: true,
        p_details: {
          email: email,
          invitation_id: invitation.id,
          invited_by: invitation.invited_by_name,
          owner_id: invitation.invited_by
        }
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: "Signup processed successfully",
      had_invitation: !!invitation
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in handle-signup function:", error);
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