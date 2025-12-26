import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

Deno.serve(async (req) => {
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

    const { conversationId, readerType } = await req.json();

    if (!conversationId || !readerType) {
      return new Response(
        JSON.stringify({ error: 'Missing conversationId or readerType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['user', 'admin'].includes(readerType)) {
      return new Response(
        JSON.stringify({ error: 'readerType must be "user" or "admin"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch conversation to validate access
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, user_id, channel, status, metadata')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return new Response(
        JSON.stringify({ error: 'Conversation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY FIX: Different validation based on reader type
    if (readerType === 'admin') {
      // Admin readers must be authenticated
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('Admin reader type requires authentication');
        return new Response(
          JSON.stringify({ error: 'Admin reader type requires authentication' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate JWT and check access
      const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } }
      });

      const { data: { user: authUser }, error: authError } = await supabaseAuth.auth.getUser();
      if (authError || !authUser) {
        console.error('Authentication failed:', authError?.message);
        return new Response(
          JSON.stringify({ error: 'Invalid authentication' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if admin has access to this conversation
      const { data: hasAccess } = await supabaseAuth.rpc('has_account_access', {
        account_owner_id: conversation.user_id
      });

      if (!hasAccess) {
        console.error(`Admin ${authUser.id} denied access to conversation owned by ${conversation.user_id}`);
        return new Response(
          JSON.stringify({ error: 'Unauthorized: No access to this conversation' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (readerType === 'user') {
      // User readers: Only allow for widget conversations that are active
      if (conversation.channel !== 'widget') {
        console.warn(`User reader attempted on non-widget conversation ${conversationId}`);
        return new Response(
          JSON.stringify({ error: 'Invalid conversation type' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!['active', 'human_takeover'].includes(conversation.status)) {
        console.warn(`User reader attempted on ${conversation.status} conversation ${conversationId}`);
        return new Response(
          JSON.stringify({ error: 'Conversation is not active' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const now = new Date().toISOString();

    // Determine which messages to mark as read based on reader type
    // If user is reading -> mark assistant messages as read by user
    // If admin is reading -> mark user messages as read by admin
    const roleToMark = readerType === 'user' ? 'assistant' : 'user';

    // Fetch messages that need to be marked as read
    const { data: messages, error: fetchError } = await supabase
      .from('messages')
      .select('id, metadata')
      .eq('conversation_id', conversationId)
      .eq('role', roleToMark);

    if (fetchError) {
      console.error('Error fetching messages:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch messages' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ success: true, updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter to only messages that haven't been read by this reader type yet
    const unreadMessages = messages.filter(msg => {
      const metadata = msg.metadata || {};
      return !metadata.read_at || metadata.read_by !== readerType;
    });

    if (unreadMessages.length === 0) {
      return new Response(
        JSON.stringify({ success: true, updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update each unread message
    let updatedCount = 0;
    for (const msg of unreadMessages) {
      const existingMetadata = msg.metadata || {};
      const newMetadata = {
        ...existingMetadata,
        read_at: now,
        read_by: readerType,
      };

      const { error: updateError } = await supabase
        .from('messages')
        .update({ metadata: newMetadata })
        .eq('id', msg.id);

      if (!updateError) {
        updatedCount++;
      } else {
        console.error('Error updating message:', msg.id, updateError);
      }
    }

    console.log(`Marked ${updatedCount} messages as read by ${readerType} in conversation ${conversationId}`);

    return new Response(
      JSON.stringify({ success: true, updated: updatedCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in mark-messages-read:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
