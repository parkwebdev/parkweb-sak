import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Reaction {
  emoji: string;
  count: number;
  userReacted: boolean;
  adminReacted: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messageId, emoji, action, reactorType } = await req.json();

    if (!messageId || !emoji || !action || !reactorType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['add', 'remove'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['user', 'admin'].includes(reactorType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid reactorType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the current message
    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select('metadata')
      .eq('id', messageId)
      .single();

    if (fetchError || !message) {
      console.error('Error fetching message:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Message not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current reactions or initialize empty array
    const metadata = message.metadata || {};
    let reactions: Reaction[] = metadata.reactions || [];

    // Find existing reaction for this emoji
    const existingIndex = reactions.findIndex((r: Reaction) => r.emoji === emoji);

    if (action === 'add') {
      if (existingIndex >= 0) {
        // Update existing reaction
        const existing = reactions[existingIndex];
        if (reactorType === 'user' && !existing.userReacted) {
          existing.userReacted = true;
          existing.count++;
        } else if (reactorType === 'admin' && !existing.adminReacted) {
          existing.adminReacted = true;
          existing.count++;
        }
      } else {
        // Add new reaction
        reactions.push({
          emoji,
          count: 1,
          userReacted: reactorType === 'user',
          adminReacted: reactorType === 'admin',
        });
      }
    } else if (action === 'remove') {
      if (existingIndex >= 0) {
        const existing = reactions[existingIndex];
        if (reactorType === 'user' && existing.userReacted) {
          existing.userReacted = false;
          existing.count--;
        } else if (reactorType === 'admin' && existing.adminReacted) {
          existing.adminReacted = false;
          existing.count--;
        }
        // Remove reaction if count is 0
        if (existing.count <= 0) {
          reactions.splice(existingIndex, 1);
        }
      }
    }

    // Update the message metadata
    const { error: updateError } = await supabase
      .from('messages')
      .update({
        metadata: { ...metadata, reactions }
      })
      .eq('id', messageId);

    if (updateError) {
      console.error('Error updating message:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update reaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Reaction ${action}ed: ${emoji} on message ${messageId} by ${reactorType}`);

    return new Response(
      JSON.stringify({ success: true, reactions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in update-message-reaction:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
