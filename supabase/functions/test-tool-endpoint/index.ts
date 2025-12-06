import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SSRF Protection: Block private IPs, localhost, and cloud metadata endpoints
const BLOCKED_URL_PATTERNS = [
  /^https?:\/\/localhost/i,
  /^https?:\/\/127\./,
  /^https?:\/\/10\./,
  /^https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^https?:\/\/192\.168\./,
  /^https?:\/\/169\.254\./,                    // AWS/Azure metadata
  /^https?:\/\/\[::1\]/,                       // IPv6 localhost
  /^https?:\/\/\[fc00:/i,                      // IPv6 private
  /^https?:\/\/\[fe80:/i,                      // IPv6 link-local
  /^https?:\/\/0\.0\.0\.0/,
  /^https?:\/\/metadata\.google/i,             // GCP metadata
  /^https?:\/\/metadata\.goog/i,
  /^https?:\/\/instance-data/i,                // AWS metadata alternative
  /^https?:\/\/100\.100\.100\.200/,            // Alibaba Cloud metadata
  /^https?:\/\/fd00:/i,                        // IPv6 private
];

function isBlockedUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // Block non-HTTP(S) protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return true;
    }
    
    // Check against blocked patterns
    return BLOCKED_URL_PATTERNS.some(pattern => pattern.test(url));
  } catch {
    // Invalid URL
    return true;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // SECURITY FIX: Require authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing authorization header for test-tool-endpoint');
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate JWT and get authenticated user
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user: authUser }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !authUser) {
      console.error('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { endpoint_url, headers, timeout_ms, sample_data, agent_id } = await req.json();

    if (!endpoint_url) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing endpoint_url' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY FIX: Require agent_id and validate ownership
    if (!agent_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing agent_id - must specify which agent this tool belongs to' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role to check agent ownership
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id, user_id')
      .eq('id', agent_id)
      .single();

    if (agentError || !agent) {
      console.error('Agent not found:', agentError);
      return new Response(
        JSON.stringify({ success: false, error: 'Agent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has access to the agent
    const { data: hasAccess } = await supabaseAuth.rpc('has_account_access', {
      account_owner_id: agent.user_id
    });

    if (!hasAccess) {
      console.error(`User ${authUser.id} denied access to agent ${agent_id} owned by ${agent.user_id}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: No access to this agent' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY FIX: SSRF Protection - validate URL
    if (isBlockedUrl(endpoint_url)) {
      console.warn(`SSRF attempt blocked: ${endpoint_url} by user ${authUser.id}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'URL not allowed: Cannot access private networks, localhost, or cloud metadata endpoints' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Testing tool endpoint: ${endpoint_url} for agent ${agent_id} by user ${authUser.id}`);

    const startTime = Date.now();
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout_ms || 10000);

    try {
      const response = await fetch(endpoint_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(headers || {}),
        },
        body: JSON.stringify(sample_data || {}),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      let responseBody: unknown;
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }

      console.log(`Tool test completed: ${response.status} in ${responseTime}ms`);

      return new Response(
        JSON.stringify({
          success: true,
          status: response.status,
          statusText: response.statusText,
          responseTime,
          contentType,
          body: responseBody,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      const error = fetchError as Error;

      if (error.name === 'AbortError') {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Request timed out after ${timeout_ms || 10000}ms`,
            responseTime,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.error('Fetch error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message || 'Failed to reach endpoint',
          responseTime,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in test-tool-endpoint:', err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
