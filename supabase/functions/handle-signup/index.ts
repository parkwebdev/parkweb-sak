import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getErrorMessage } from '../_shared/errors.ts';

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

    // Atomically mark signup as processing to prevent race conditions
    // This UPDATE only succeeds if signup_completed_at IS NULL
    const { data: lockResult, error: lockError } = await supabase
      .from('profiles')
      .update({ signup_completed_at: new Date().toISOString() })
      .eq('user_id', user_id)
      .is('signup_completed_at', null)
      .select('user_id')
      .maybeSingle();

    if (lockError) {
      console.error('Error acquiring signup lock:', lockError);
    }

    // If lockResult is null, another request already claimed this signup
    if (!lockResult) {
      console.log(`Signup already processed for user ${user_id}, skipping duplicate`);
      return new Response(JSON.stringify({
        success: true,
        message: "Signup already processed",
        skipped: true
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Acquired signup lock for user ${user_id}, proceeding with signup flow`);

    // Check if this email has a pending invitation (including Pilot team invites)
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

      // Check if this is a Pilot team invitation
      if (invitation.is_pilot_invite && invitation.pilot_role) {
        console.log(`Processing Pilot team invitation for: ${email} as ${invitation.pilot_role}`);
        
        // Assign the Pilot team role to the user
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: user_id,
            role: invitation.pilot_role,
            admin_permissions: invitation.pilot_role === 'super_admin' 
              ? [] 
              : ['view_accounts', 'view_team', 'view_content', 'view_revenue', 'view_settings'],
          }, { onConflict: 'user_id' });

        if (roleError) {
          console.error('Error assigning Pilot team role:', roleError);
        } else {
          console.log(`Assigned ${invitation.pilot_role} role to user ${user_id}`);
        }

        // Notify the super admin who sent the invite
        await supabase.from('notifications').insert({
          user_id: invitation.invited_by,
          type: 'team',
          title: 'Pilot Team Member Joined',
          message: `${email} accepted your invitation and joined as ${invitation.pilot_role === 'super_admin' ? 'Super Admin' : 'Pilot Support'}`,
          data: { member_id: user_id, email: email, role: invitation.pilot_role },
          read: false
        });
        console.log('Pilot team member join notification created');

        // Log to admin audit log
        await supabase.from('admin_audit_log').insert({
          admin_user_id: invitation.invited_by,
          action: 'team_invite',
          target_type: 'team',
          target_id: user_id,
          target_email: email,
          details: {
            action: 'pilot_invite_accepted',
            role: invitation.pilot_role,
            invited_by: invitation.invited_by_name
          }
        });
      } else {
        // Regular team member invitation (non-Pilot)
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
      }

      console.log(`Marked invitation as accepted for: ${email}`);

      // Log the successful signup from invitation
      await supabase.rpc('log_security_event', {
        p_user_id: user_id,
        p_action: invitation.is_pilot_invite ? 'pilot_invitation_accepted' : 'team_invitation_accepted',
        p_resource_type: 'team',
        p_resource_id: email,
        p_success: true,
        p_details: {
          email: email,
          invitation_id: invitation.id,
          invited_by: invitation.invited_by_name,
          owner_id: invitation.invited_by,
          is_pilot_invite: invitation.is_pilot_invite || false,
          role: invitation.pilot_role || 'member'
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
      title: 'Welcome to Pilot! 🎉',
      message: 'Configure Ari to get started with your AI assistant',
      data: { first_login: true },
      read: false
    });
    console.log('Welcome notification created');

    // Send welcome email
    const userName = user.user_metadata?.display_name || 
                     user.user_metadata?.full_name || 
                     email?.split('@')[0] || 'there';

    // Get companyName from inviter's profile (for team members)
    let companyName: string | undefined;
    if (invitation) {
      const { data: inviterProfile } = await supabase
        .from('profiles')
        .select('company_name')
        .eq('user_id', invitation.invited_by)
        .single();
      companyName = inviterProfile?.company_name || undefined;
    }

    // Send welcome email via send-auth-email function
    const appUrl = Deno.env.get("APP_URL") || "https://getpilot.io";
    try {
      const emailResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-auth-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({
          type: 'welcome',
          to: email,
          userName,
          companyName,
          actionUrl: `${appUrl}/ari`,
        }),
      });
      
      if (emailResponse.ok) {
        console.log('Welcome email sent successfully');
      } else {
        const errorText = await emailResponse.text();
        console.error('Welcome email failed:', errorText);
      }
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail signup if email fails
    }

    // signup_completed_at was already set at the start (atomic lock)

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

  } catch (error: unknown) {
    console.error("Error in handle-signup function:", error);
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