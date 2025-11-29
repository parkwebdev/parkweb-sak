import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting cleanup of expired conversations...');

    // Find expired conversations
    const { data: expiredConversations, error: fetchError } = await supabase
      .from('conversations')
      .select('id, org_id, agent_id, created_at, expires_at')
      .lt('expires_at', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching expired conversations:', fetchError);
      throw fetchError;
    }

    if (!expiredConversations || expiredConversations.length === 0) {
      console.log('No expired conversations found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No expired conversations to clean up',
          deleted: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${expiredConversations.length} expired conversations`);

    const conversationIds = expiredConversations.map(c => c.id);

    // Delete messages first (foreign key constraint)
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .in('conversation_id', conversationIds);

    if (messagesError) {
      console.error('Error deleting messages:', messagesError);
      throw messagesError;
    }

    console.log('Deleted messages for expired conversations');

    // Delete conversation takeovers
    const { error: takeoversError } = await supabase
      .from('conversation_takeovers')
      .delete()
      .in('conversation_id', conversationIds);

    if (takeoversError) {
      console.error('Error deleting takeovers:', takeoversError);
      throw takeoversError;
    }

    console.log('Deleted takeovers for expired conversations');

    // Delete conversations
    const { error: conversationsError } = await supabase
      .from('conversations')
      .delete()
      .in('id', conversationIds);

    if (conversationsError) {
      console.error('Error deleting conversations:', conversationsError);
      throw conversationsError;
    }

    console.log(`Successfully deleted ${conversationIds.length} expired conversations`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Cleaned up ${conversationIds.length} expired conversations`,
        deleted: conversationIds.length,
        conversations: expiredConversations.map(c => ({
          id: c.id,
          org_id: c.org_id,
          expired_at: c.expires_at
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Cleanup error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
