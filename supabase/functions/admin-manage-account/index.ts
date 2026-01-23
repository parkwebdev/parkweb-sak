/**
 * Admin Manage Account Edge Function
 * 
 * Handles account suspension and activation for Super Admins.
 * 
 * @module functions/admin-manage-account
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getErrorMessage } from '../_shared/errors.ts';

interface ManageAccountRequest {
  action: 'suspend' | 'activate';
  userId: string;
  reason?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();

  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed', requestId }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header', requestId }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // User client to verify the calling admin
    const supabaseUser = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: authHeader } }
    });

    // Get the calling user
    const { data: { user: adminUser }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !adminUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', requestId }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if calling user has manage_accounts permission
    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('role, admin_permissions')
      .eq('user_id', adminUser.id)
      .single();

    const isSuperAdmin = adminProfile?.role === 'super_admin';
    const hasManagePermission = isSuperAdmin || 
      (adminProfile?.admin_permissions as string[] || []).includes('manage_accounts');

    if (!hasManagePermission) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: requires manage_accounts permission', requestId }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: ManageAccountRequest = await req.json();
    const { action, userId, reason } = body;

    if (!action || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: action, userId', requestId }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action !== 'suspend' && action !== 'activate') {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Must be "suspend" or "activate"', requestId }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-suspension
    if (action === 'suspend' && userId === adminUser.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot suspend your own account', requestId }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get target user details
    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('user_id, email, display_name, status, role')
      .eq('user_id', userId)
      .single();

    if (!targetProfile) {
      return new Response(
        JSON.stringify({ error: 'User not found', requestId }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent suspending other super admins (unless you're also a super admin)
    if (action === 'suspend' && targetProfile.role === 'super_admin' && !isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: 'Cannot suspend a super admin account', requestId }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newStatus = action === 'suspend' ? 'suspended' : 'active';

    // Update profile status
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Failed to update profile status:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update account status', requestId }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For suspension, force sign out all sessions
    if (action === 'suspend') {
      const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(userId);
      if (signOutError) {
        console.warn('Failed to sign out user sessions:', signOutError);
        // Don't fail the request, the account is still suspended
      }
    }

    // Log the audit action
    const auditAction = action === 'suspend' ? 'account_suspend' : 'account_activate';
    const { error: auditError } = await supabaseAdmin
      .from('admin_audit_log')
      .insert({
        admin_user_id: adminUser.id,
        action: auditAction,
        target_type: 'account',
        target_id: userId,
        target_email: targetProfile.email,
        details: {
          reason: reason || null,
          previous_status: targetProfile.status,
          new_status: newStatus,
        },
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'),
        user_agent: req.headers.get('user-agent'),
      });

    if (auditError) {
      console.warn('Failed to log audit action:', auditError);
      // Don't fail the request
    }

    return new Response(
      JSON.stringify({
        success: true,
        requestId,
        action,
        userId,
        newStatus,
        message: action === 'suspend' 
          ? 'Account suspended and user signed out' 
          : 'Account activated',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('admin-manage-account error:', error);
    return new Response(
      JSON.stringify({ error: getErrorMessage(error), requestId }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
