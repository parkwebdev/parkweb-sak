import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/javascript',
  'Cache-Control': 'public, max-age=3600',
}

// ============================================================================
// Rate Limiting - 30 requests per minute per IP
// ============================================================================
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(clientIp: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(clientIp);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  record.count++;
  return false;
}

// Cleanup old entries periodically
function cleanupRateLimitMap() {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime + RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.delete(ip);
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';

    // Check rate limit
    if (isRateLimited(clientIp)) {
      console.log(`Rate limited IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } }
      );
    }

    // Periodic cleanup
    if (Math.random() < 0.01) {
      cleanupRateLimitMap();
    }

    // Determine the app URL dynamically
    let appUrl = Deno.env.get('APP_URL') || '';
    
    // If no APP_URL, try to get from referer or use production URL
    if (!appUrl) {
      const referer = req.headers.get('referer');
      if (referer) {
        const url = new URL(referer);
        appUrl = `${url.protocol}//${url.host}`;
      } else {
        // Default to Supabase project URL
        appUrl = 'https://mvaimvwdukpgvkifkfpa.supabase.co';
      }
    }

    console.log('[Serve Widget] App URL:', appUrl);

    // Generate the loader script that loads the full widget bundle
    const loaderScript = `
(function() {
  'use strict';
  
  var currentScript = document.currentScript;
  if (!currentScript || !currentScript.hasAttribute('data-agent-id')) {
    return;
  }
  
  var config = {
    agentId: currentScript.getAttribute('data-agent-id'),
    position: currentScript.getAttribute('data-position') || 'bottom-right',
    primaryColor: currentScript.getAttribute('data-primary-color') || '#3b82f6',
    appUrl: '${appUrl}',
  };
  
  var script = document.createElement('script');
  script.src = config.appUrl + '/pilot-widget.js';
  script.async = true;
  script.setAttribute('data-agent-id', config.agentId);
  script.setAttribute('data-position', config.position);
  script.setAttribute('data-primary-color', config.primaryColor);
  script.setAttribute('data-app-url', config.appUrl);
  document.head.appendChild(script);
})();
`;

    return new Response(
      loaderScript,
      { 
        headers: corsHeaders,
        status: 200,
      }
    )
  } catch (error: unknown) {
    console.error('[Serve Widget] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to serve widget loader';
    return new Response(
      JSON.stringify({ error: message }),
      { 
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
