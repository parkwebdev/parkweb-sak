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
    // Verify JWT token from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header", success: false }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Create client with anon key to verify JWT
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      console.error("JWT verification failed:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token", success: false }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Use verified user data instead of request body
    const email = user.email;
    const user_id = user.id;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "User email not found", success: false }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Processing signup completion for verified user: ${email}`);

    // Create service role client for database operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

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
        
        // Notify team owner that a new member joined
        await supabase.from('notifications').insert({
          user_id: invitation.invited_by,
          type: 'team',
          title: 'Team Member Joined',
          message: `${email} accepted your invitation and joined the team`,
          data: { member_id: user_id, email: email },
          read: false
        });
        console.log('Team member join notification created');
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

    // Auto-create Ari agent for new account owners (not team members)
    if (!invitation) {
      const { error: agentError } = await supabase
        .from('agents')
        .insert({
          user_id: user_id,
          name: 'Ari',
          system_prompt: 'You are Ari, a friendly and helpful AI assistant. Be conversational, concise, and helpful.',
          model: 'google/gemini-2.5-flash',
          status: 'draft',
        });

      if (agentError) {
        console.error('Error creating Ari agent:', agentError);
      } else {
        console.log(`Created Ari agent for user ${user_id}`);
      }
    }

    // Create welcome notification for new user
    await supabase.from('notifications').insert({
      user_id: user_id,
      type: 'system',
      title: 'Welcome to ChatPad! 🎉',
      message: 'Configure Ari to get started with your AI assistant',
      data: { first_login: true },
      read: false
    });
    console.log('Welcome notification created');

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