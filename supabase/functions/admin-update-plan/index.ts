/**
 * Admin Update Plan Edge Function
 * 
 * Allows super admins to manually update a user's subscription plan.
 * 
 * @module functions/admin-update-plan
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders } from '../_shared/cors.ts';

interface UpdatePlanRequest {
  userId: string;
  planId: string | null;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing authorization header' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Initialize Supabase clients
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the calling user
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if caller is super_admin
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleData?.role !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Only super admins can update user plans' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { userId, planId } = await req.json() as UpdatePlanRequest;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify target user exists
    const { data: targetProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, email, display_name')
      .eq('user_id', userId)
      .single();

    if (profileError || !targetProfile) {
      return new Response(
        JSON.stringify({ error: 'Target user not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current subscription
    const { data: currentSub } = await supabaseAdmin
      .from('subscriptions')
      .select('id, plan_id, plans!inner(name)')
      .eq('user_id', userId)
      .maybeSingle();

    const previousPlanName = (currentSub?.plans as { name?: string } | null)?.name || 'Free';
    let newPlanName = 'Free';

    if (planId === null) {
      // Remove subscription (revert to free)
      if (currentSub) {
        await supabaseAdmin
          .from('subscriptions')
          .delete()
          .eq('id', currentSub.id);
      }
    } else {
      // Verify plan exists
      const { data: plan, error: planError } = await supabaseAdmin
        .from('plans')
        .select('id, name')
        .eq('id', planId)
        .single();

      if (planError || !plan) {
        return new Response(
          JSON.stringify({ error: 'Plan not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      newPlanName = plan.name;

      if (currentSub) {
        // Update existing subscription
        await supabaseAdmin
          .from('subscriptions')
          .update({ 
            plan_id: planId,
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', currentSub.id);
      } else {
        // Create new subscription
        await supabaseAdmin
          .from('subscriptions')
          .insert({
            user_id: userId,
            plan_id: planId,
            status: 'active',
          });
      }
    }

    // Log the action
    await supabaseAdmin.from('admin_audit_log').insert({
      admin_user_id: user.id,
      action: 'plan_change',
      target_type: 'user',
      target_id: userId,
      target_email: targetProfile.email,
      details: {
        previous_plan: previousPlanName,
        new_plan: newPlanName,
        plan_id: planId,
      },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Plan updated from ${previousPlanName} to ${newPlanName}` 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error updating plan:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
