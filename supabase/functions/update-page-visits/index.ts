import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting: 60 requests per minute per IP
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 60;

// In-memory rate limit tracking (resets on cold start - acceptable for this use case)
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    // New window
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  record.count++;
  return false;
}

// Cleanup old entries periodically to prevent memory leaks
function cleanupRateLimitMap() {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now - record.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitMap.delete(ip);
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Cleanup old entries periodically (every ~100 requests)
    if (Math.random() < 0.01) {
      cleanupRateLimitMap();
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { conversationId, pageVisit, referrerJourney } = await req.json();

    // Log incoming data for debugging
    console.log('Received update-page-visits request:', {
      conversationId,
      hasPageVisit: !!pageVisit,
      hasReferrerJourney: !!referrerJourney,
      referrerJourney: referrerJourney || null,
    });

    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: 'Conversation ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current conversation metadata
    const { data: conversation, error: fetchError } = await supabase
      .from('conversations')
      .select('metadata')
      .eq('id', conversationId)
      .single();

    if (fetchError) {
      console.error('Error fetching conversation:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Conversation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentMetadata = conversation.metadata || {};
    let updatedMetadata = { ...currentMetadata };

    // Add page visit if provided
    if (pageVisit && pageVisit.url && pageVisit.entered_at) {
      const currentVisits = currentMetadata.visited_pages || [];
      
      // Check if this exact page visit already exists
      const exists = currentVisits.some(
        (v: any) => v.url === pageVisit.url && v.entered_at === pageVisit.entered_at
      );
      
      if (!exists) {
        // If there's a previous visit with duration 0, update it
        const lastVisit = currentVisits[currentVisits.length - 1];
        if (lastVisit && lastVisit.duration_ms === 0 && pageVisit.previous_duration_ms) {
          lastVisit.duration_ms = pageVisit.previous_duration_ms;
        }
        
        updatedMetadata.visited_pages = [
          ...currentVisits,
          {
            url: pageVisit.url,
            entered_at: pageVisit.entered_at,
            duration_ms: pageVisit.duration_ms || 0,
          }
        ];
        
        console.log(`Added page visit: ${pageVisit.url} to conversation ${conversationId}`);
      }
    }

    // Add referrer journey if provided and not already set
    if (referrerJourney && !currentMetadata.referrer_journey) {
      updatedMetadata.referrer_journey = {
        referrer_url: referrerJourney.referrer_url || null,
        landing_page: referrerJourney.landing_page || null,
        utm_source: referrerJourney.utm_source || null,
        utm_medium: referrerJourney.utm_medium || null,
        utm_campaign: referrerJourney.utm_campaign || null,
        utm_term: referrerJourney.utm_term || null,
        utm_content: referrerJourney.utm_content || null,
        entry_type: referrerJourney.entry_type || 'direct',
      };
      console.log(`Added referrer journey to conversation ${conversationId}:`, updatedMetadata.referrer_journey);
    }

    // Update conversation metadata
    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    if (updateError) {
      console.error('Error updating conversation:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update conversation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in update-page-visits:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
