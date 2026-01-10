/**
 * List User Sessions Edge Function
 * 
 * Fetches all active sessions for the authenticated user from auth.sessions table.
 * Returns session details including device info, IP address, and timestamps.
 * 
 * @module functions/list-user-sessions
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SessionRow {
  id: string;
  created_at: string;
  updated_at: string;
  user_agent: string | null;
  ip: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[list-user-sessions] No authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role to verify user from token
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Handle varying casing/spacing in Bearer token
    const token = authHeader.replace(/^bearer\s+/i, '').trim();
    if (!token) {
      console.error('[list-user-sessions] Empty token after parsing');
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: 'Empty token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) {
      console.error('[list-user-sessions] User verification failed:', userError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const user = userData.user;

    console.log('[list-user-sessions] Fetching sessions for user:', user.id);

    // Decode current session ID from JWT to mark as current
    let currentSessionId: string | null = null;
    try {
      const token = authHeader.replace('Bearer ', '');
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentSessionId = payload.session_id || null;
      console.log('[list-user-sessions] Current session ID:', currentSessionId);
    } catch (e) {
      console.warn('[list-user-sessions] Could not decode session ID from JWT');
    }

    // Query auth.sessions for this user using RPC function (reuse supabaseAdmin from above)

    // Query auth.sessions for this user using RPC function
    const { data: sessions, error: sessionsError } = await supabaseAdmin.rpc(
      'get_user_sessions',
      { p_user_id: user.id }
    );

    if (sessionsError) {
      console.error('[list-user-sessions] Error fetching sessions:', sessionsError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch sessions', details: sessionsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[list-user-sessions] Found', sessions?.length || 0, 'sessions');

    // Map sessions and mark current
    const enrichedSessions = (sessions || []).map((s: SessionRow) => ({
      id: s.id,
      created_at: s.created_at,
      updated_at: s.updated_at,
      user_agent: s.user_agent,
      ip: s.ip,
      is_current: s.id === currentSessionId,
    }));

    return new Response(
      JSON.stringify({
        sessions: enrichedSessions,
        current_session_id: currentSessionId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[list-user-sessions] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
