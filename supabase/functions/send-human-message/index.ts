import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// URL regex for extracting links from content
const URL_REGEX = /https?:\/\/[^\s<>"')\]]+/gi;

// Fetch link previews for URLs in content (max 3)
async function fetchLinkPreviews(content: string, supabaseUrl: string, supabaseKey: string): Promise<any[]> {
  const urls = Array.from(new Set(content.match(URL_REGEX) || [])).slice(0, 3);
  if (urls.length === 0) return [];
  
  console.log(`Fetching link previews for ${urls.length} URLs`);
  
  const previews = await Promise.all(
    urls.map(async (url) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${supabaseUrl}/functions/v1/fetch-link-preview`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ url }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) return null;
        
        const data = await response.json();
        if (data && (data.title || data.videoType)) {
          return data;
        }
        return null;
      } catch (error) {
        console.error(`Error fetching preview for ${url}:`, error.message);
        return null;
      }
    })
  );
  
  return previews.filter(p => p !== null);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // SECURITY FIX: Require and validate JWT authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing authorization header for send-human-message');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate JWT and get authenticated user
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

    // SECURITY FIX: Use authenticated user's ID - ignore any senderId from request body
    const senderId = authUser.id;

    const { conversationId, content } = await req.json();

    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }
    if (!content || !content.trim()) {
      throw new Error('Message content is required');
    }

    console.log(`Sending human message to conversation ${conversationId} from authenticated user ${senderId}`);

    // Initialize Supabase client with service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify conversation exists and get owner info
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, status, user_id, metadata')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      console.error('Conversation not found:', convError);
      throw new Error('Conversation not found');
    }

    // SECURITY FIX: Validate user has access to this conversation
    const { data: hasAccess } = await supabaseAuth.rpc('has_account_access', {
      account_owner_id: conversation.user_id
    });

    if (!hasAccess) {
      console.error(`User ${senderId} denied access to conversation owned by ${conversation.user_id}`);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: No access to this conversation' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (conversation.status !== 'human_takeover') {
      console.warn(`Conversation ${conversationId} is not in human_takeover status (current: ${conversation.status})`);
      // Still allow sending but log warning - might be returning to AI soon
    }

    // Get sender profile for name and avatar
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('display_name, email, avatar_url')
      .eq('user_id', senderId)
      .single();

    const senderName = senderProfile?.display_name || senderProfile?.email || 'Team Member';
    const senderAvatar = senderProfile?.avatar_url || null;

    // Fetch link previews for any URLs in the message content
    const linkPreviews = await fetchLinkPreviews(content.trim(), supabaseUrl, supabaseServiceKey);
    console.log(`Cached ${linkPreviews.length} link previews for human message`);

    // Insert the message with human sender metadata
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant', // Shows on the "bot" side in widget
        content: content.trim(),
        metadata: {
          sender_type: 'human',
          sender_id: senderId,
          sender_name: senderName,
          sender_avatar: senderAvatar,
          source: 'admin',
          link_previews: linkPreviews.length > 0 ? linkPreviews : undefined,
        },
      })
      .select()
      .single();

    if (msgError) {
      console.error('Error inserting message:', msgError);
      throw new Error('Failed to send message');
    }

    console.log(`Human message sent successfully: ${message.id}`);

    // Update conversation updated_at and metadata with last message preview
    const currentMetadata = (conversation.metadata as Record<string, unknown>) || {};
    await supabase
      .from('conversations')
      .update({
        updated_at: new Date().toISOString(),
        metadata: {
          ...currentMetadata,
          messages_count: ((currentMetadata.messages_count as number) || 0) + 1,
          last_human_response_at: new Date().toISOString(),
          last_human_responder_id: senderId,
          last_human_responder_name: senderName,
          // Store last message preview for conversation list
          last_message_preview: content.trim().substring(0, 60),
          last_message_role: 'human',
          last_message_at: new Date().toISOString(),
        },
      })
      .eq('id', conversationId);

    // Dispatch webhook event if configured
    try {
      await fetch(`${supabaseUrl}/functions/v1/dispatch-webhook-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          userId: conversation.user_id,
          eventType: 'message.sent',
          payload: {
            conversation_id: conversationId,
            message_id: message.id,
            sender_type: 'human',
            sender_name: senderName,
            content_preview: content.substring(0, 100),
          },
        }),
      });
    } catch (webhookError) {
      console.error('Webhook dispatch error (non-blocking):', webhookError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: {
          id: message.id,
          content: message.content,
          created_at: message.created_at,
          role: message.role,
          metadata: message.metadata,
        },
        linkPreviews: linkPreviews.length > 0 ? linkPreviews : undefined,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Send human message error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
