import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, rating, feedback, triggerType } = await req.json();

    // Validate input
    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: 'Conversation ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return new Response(
        JSON.stringify({ error: 'Rating must be between 1 and 5' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!triggerType || !['team_closed', 'ai_marked_complete'].includes(triggerType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid trigger type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify conversation exists
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return new Response(
        JSON.stringify({ error: 'Conversation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if rating already exists for this conversation
    const { data: existingRating } = await supabase
      .from('conversation_ratings')
      .select('id')
      .eq('conversation_id', conversationId)
      .single();

    if (existingRating) {
      // Update existing rating
      const { error: updateError } = await supabase
        .from('conversation_ratings')
        .update({
          rating,
          feedback: feedback || null,
          trigger_type: triggerType,
        })
        .eq('conversation_id', conversationId);

      if (updateError) {
        console.error('Error updating rating:', updateError);
        throw updateError;
      }

      console.log(`Updated rating for conversation ${conversationId}: ${rating} stars`);
    } else {
      // Insert new rating
      const { error: insertError } = await supabase
        .from('conversation_ratings')
        .insert({
          conversation_id: conversationId,
          rating,
          feedback: feedback || null,
          trigger_type: triggerType,
        });

      if (insertError) {
        console.error('Error inserting rating:', insertError);
        throw insertError;
      }

      console.log(`Saved rating for conversation ${conversationId}: ${rating} stars`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Submit rating error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
