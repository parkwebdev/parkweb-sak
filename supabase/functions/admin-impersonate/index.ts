/**
 * Admin Impersonate Edge Function
 * 
 * Allows super admins to impersonate user accounts for support purposes.
 * Includes rate limiting, audit logging, and security restrictions.
 * 
 * @module functions/admin-impersonate
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { corsHeaders } from "../_shared/cors.ts";
import { getErrorMessage } from "../_shared/errors.ts";

/** Maximum impersonations allowed per hour per admin */
const MAX_IMPERSONATIONS_PER_HOUR = 5;

/** Impersonation session duration in milliseconds (30 minutes) */
const SESSION_DURATION_MS = 30 * 60 * 1000;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify admin user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid token');
    }

    // Check super_admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (roleData?.role !== 'super_admin') {
      throw new Error('Unauthorized: Super admin access required');
    }

    const body = await req.json();
    const { action, targetUserId, reason, sessionId } = body;

    // Validate action
    if (!['start', 'end'].includes(action)) {
      throw new Error('Invalid action. Must be "start" or "end"');
    }

    if (action === 'start') {
      // Validate required fields for starting impersonation
      if (!targetUserId) {
        throw new Error('Target user ID is required');
      }
      if (!reason || reason.trim().length < 10) {
        throw new Error('A reason of at least 10 characters is required');
      }

      // Check rate limit (max impersonations per hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count, error: countError } = await supabase
        .from('impersonation_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('admin_user_id', user.id)
        .gte('started_at', oneHourAgo);

      if (countError) {
        console.error('Rate limit check error:', countError);
      }

      if (count && count >= MAX_IMPERSONATIONS_PER_HOUR) {
        throw new Error(`Rate limit exceeded: Maximum ${MAX_IMPERSONATIONS_PER_HOUR} impersonations per hour`);
      }

      // Cannot impersonate self
      if (targetUserId === user.id) {
        throw new Error('Cannot impersonate yourself');
      }

      // Cannot impersonate another super_admin
      const { data: targetRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', targetUserId)
        .single();
      
      if (targetRole?.role === 'super_admin') {
        throw new Error('Cannot impersonate another super admin');
      }

      // Verify target user exists
      const { data: targetProfile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .eq('user_id', targetUserId)
        .single();

      if (profileError || !targetProfile) {
        throw new Error('Target user not found');
      }

      // End any existing active sessions for this admin
      await supabase
        .from('impersonation_sessions')
        .update({ 
          is_active: false, 
          ended_at: new Date().toISOString() 
        })
        .eq('admin_user_id', user.id)
        .eq('is_active', true);

      // Create impersonation session
      const { data: session, error: sessionError } = await supabase
        .from('impersonation_sessions')
        .insert({
          admin_user_id: user.id,
          target_user_id: targetUserId,
          reason: reason.trim(),
          is_active: true,
          metadata: {
            target_display_name: targetProfile.display_name,
            target_email: targetProfile.email,
            user_agent: req.headers.get('user-agent'),
          },
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Session creation error:', sessionError);
        throw new Error('Failed to create impersonation session');
      }

      // Log audit action
      await supabase.from('admin_audit_log').insert({
        admin_user_id: user.id,
        action: 'impersonation.start',
        target_type: 'account',
        target_id: targetUserId,
        target_email: targetProfile.email,
        details: { 
          reason: reason.trim(), 
          session_id: session.id,
          target_display_name: targetProfile.display_name,
        },
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'),
        user_agent: req.headers.get('user-agent'),
      });

      console.log(`Impersonation started: Admin ${user.id} -> User ${targetUserId} (Session: ${session.id})`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          sessionId: session.id,
          targetUserId,
          targetDisplayName: targetProfile.display_name,
          expiresAt: new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'end') {
      if (!sessionId) {
        throw new Error('Session ID is required to end impersonation');
      }

      // Verify session belongs to this admin and is active
      const { data: existingSession } = await supabase
        .from('impersonation_sessions')
        .select('id, target_user_id, is_active')
        .eq('id', sessionId)
        .eq('admin_user_id', user.id)
        .single();

      if (!existingSession) {
        throw new Error('Session not found or does not belong to you');
      }

      if (!existingSession.is_active) {
        // Session already ended - return success anyway
        return new Response(
          JSON.stringify({ success: true, alreadyEnded: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // End the session
      const { error: updateError } = await supabase
        .from('impersonation_sessions')
        .update({ 
          is_active: false, 
          ended_at: new Date().toISOString() 
        })
        .eq('id', sessionId)
        .eq('admin_user_id', user.id);

      if (updateError) {
        console.error('Session update error:', updateError);
        throw new Error('Failed to end impersonation session');
      }

      // Log audit action
      await supabase.from('admin_audit_log').insert({
        admin_user_id: user.id,
        action: 'impersonation.end',
        target_type: 'session',
        target_id: sessionId,
        details: { target_user_id: existingSession.target_user_id },
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'),
        user_agent: req.headers.get('user-agent'),
      });

      console.log(`Impersonation ended: Session ${sessionId} by Admin ${user.id}`);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');
  } catch (error: unknown) {
    console.error('Admin impersonate error:', error);
    
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
