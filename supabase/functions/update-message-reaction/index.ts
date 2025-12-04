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

// Simple in-memory rate limiting (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // 30 reactions per minute per IP

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    // Check rate limit
    if (isRateLimited(clientIp)) {
      console.log(`Rate limited IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Validate emoji (only allow common emojis, prevent injection)
    const allowedEmojis = ['👍', '❤️', '😂', '😮', '😢', '🎉', '👎', '🔥', '💯', '🙏'];
    if (!allowedEmojis.includes(emoji)) {
      return new Response(
        JSON.stringify({ error: 'Invalid emoji' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate messageId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(messageId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid message ID format' }),
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

    console.log(`Reaction ${action}ed: ${emoji} on message ${messageId} by ${reactorType} from IP ${clientIp}`);

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
