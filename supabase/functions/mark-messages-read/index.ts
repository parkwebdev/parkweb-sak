import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
  } catch (error) {
    console.error('Error in mark-messages-read:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
