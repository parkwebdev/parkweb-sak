import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  default: { windowMs: 60000, maxRequests: 100 }, // 100 requests per minute
  'agents:read': { windowMs: 60000, maxRequests: 200 },
  'agents:write': { windowMs: 60000, maxRequests: 50 },
  'conversations:read': { windowMs: 60000, maxRequests: 200 },
  'conversations:write': { windowMs: 60000, maxRequests: 50 },
};

// Simple in-memory rate limiter (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(apiKeyId: string, permission: string): boolean {
  const config = RATE_LIMITS[permission] || RATE_LIMITS.default;
  const key = `${apiKeyId}:${permission}`;
  const now = Date.now();
  
  const existing = rateLimitStore.get(key);
  
  if (!existing || now > existing.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return true;
  }
  
  if (existing.count >= config.maxRequests) {
    return false;
  }
  
  existing.count++;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get API key from header
    const apiKey = req.headers.get('x-api-key');
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate API key format
    if (!apiKey.startsWith('pk_')) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key format' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Look up API key in database
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('id, org_id, permissions, name')
      .eq('key', apiKey)
      .single();

    if (apiKeyError || !apiKeyData) {
      console.log('API key not found:', apiKeyError);
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get requested permission from query params
    const url = new URL(req.url);
    const requiredPermission = url.searchParams.get('permission');

    // Check if API key has required permission
    if (requiredPermission) {
      const hasPermission = apiKeyData.permissions?.includes(requiredPermission);
      
      if (!hasPermission) {
        return new Response(
          JSON.stringify({ 
            error: 'Insufficient permissions',
            required: requiredPermission,
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Check rate limit for this permission
      if (!checkRateLimit(apiKeyData.id, requiredPermission)) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.',
          }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Update last_used_at timestamp (non-blocking)
    supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKeyData.id)
      .then(() => console.log('Updated last_used_at for key:', apiKeyData.name));

    // Return validated key info
    return new Response(
      JSON.stringify({
        valid: true,
        org_id: apiKeyData.org_id,
        permissions: apiKeyData.permissions,
        key_name: apiKeyData.name,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error validating API key:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
