import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
