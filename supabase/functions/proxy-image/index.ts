import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// SSRF Protection - Block internal/private network addresses
// ============================================================================
const BLOCKED_URL_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,         // Link-local
  /^0\.0\.0\.0$/,
  /^metadata\.google\.internal$/i,
  /^metadata\.goog$/i,
  /^instance-data$/i,
  /\.internal$/i,
  /^fc00:/i,             // IPv6 private
  /^fe80:/i,             // IPv6 link-local
  /^::1$/,               // IPv6 localhost
];

function isBlockedUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    
    return BLOCKED_URL_PATTERNS.some(pattern => pattern.test(hostname));
  } catch {
    return true; // Block invalid URLs
  }
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

// ============================================================================
// Response Size Limit - 5MB max
// ============================================================================
const MAX_RESPONSE_SIZE = 5 * 1024 * 1024; // 5MB

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Periodic cleanup
    if (Math.random() < 0.01) {
      cleanupRateLimitMap();
    }

    const url = new URL(req.url);
    const imageUrl = url.searchParams.get('url');

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing url parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(imageUrl);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SSRF Protection: Block internal/private network addresses
    if (isBlockedUrl(imageUrl)) {
      console.warn(`SSRF blocked image URL: ${imageUrl}`);
      return new Response(
        JSON.stringify({ error: 'URL not allowed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Proxying image: ${imageUrl}`);

    // Fetch the image with appropriate headers
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ChatPad/1.0; +https://chatpad.ai)',
        'Accept': 'image/*',
        'Referer': parsedUrl.origin,
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch image' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const contentType = response.headers.get('Content-Type') || 'image/jpeg';
    
    // Validate content type is actually an image
    if (!contentType.startsWith('image/')) {
      console.error(`Invalid content type: ${contentType}`);
      return new Response(
        JSON.stringify({ error: 'Not an image' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check content length if available
    const contentLength = response.headers.get('Content-Length');
    if (contentLength && parseInt(contentLength) > MAX_RESPONSE_SIZE) {
      console.error(`Image too large: ${contentLength} bytes`);
      return new Response(
        JSON.stringify({ error: 'Image too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const imageData = await response.arrayBuffer();

    // Double-check size after download
    if (imageData.byteLength > MAX_RESPONSE_SIZE) {
      console.error(`Image too large after download: ${imageData.byteLength} bytes`);
      return new Response(
        JSON.stringify({ error: 'Image too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(imageData, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch (error: unknown) {
    console.error('Proxy error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
