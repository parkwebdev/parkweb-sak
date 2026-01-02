/**
 * Conversation Handler Module
 * 
 * Handles conversation lifecycle: creation, status checking, and state management.
 * Extracted from widget-chat main handler for modularity.
 * 
 * @module _shared/handlers/conversation
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { corsHeaders } from "../cors.ts";
import type { ConversationMetadata } from "../types.ts";

/** Conversation state after checks */
export interface ConversationState {
  conversationId: string;
  conversation: { status: string; metadata: any } | null;
  isNew: boolean;
}

/** Human takeover information */
export interface TakeoverInfo {
  name: string | null;
  avatar: string | null;
}

/** Result from conversation status check */
export interface ConversationCheckResult {
  shouldReturn: boolean;
  response?: Response;
  conversation?: { status: string; metadata: any };
}

/**
 * Creates or retrieves an existing conversation.
 * Handles preview mode, new conversation creation, and metadata setup.
 */
export async function getOrCreateConversation(
  supabase: ReturnType<typeof createClient>,
  options: {
    conversationId: string | undefined;
    agentId: string;
    agentUserId: string;
    previewMode: boolean;
    ipAddress: string;
    country: string;
    city: string;
    countryCode: string;
    region: string;
    device: string;
    browser: string;
    os: string;
    referer: string | null;
    leadId: string | undefined;
    visitorId: string | undefined;
    referrerJourney: any;
  }
): Promise<{ conversationId: string; isNew: boolean }> {
  const {
    conversationId,
    agentId,
    agentUserId,
    previewMode,
    ipAddress,
    country,
    city,
    countryCode,
    region,
    device,
    browser,
    os,
    referer,
    leadId,
    visitorId,
    referrerJourney,
  } = options;

  // Preview mode: skip all persistence, use ephemeral conversation
  if (previewMode) {
    console.log('Preview mode - skipping conversation persistence');
    return {
      conversationId: `preview-${crypto.randomUUID()}`,
      isNew: true,
    };
  }

  // Check if we have an existing valid conversation ID
  if (
    conversationId &&
    conversationId !== 'new' &&
    !conversationId.startsWith('conv_') &&
    !conversationId.startsWith('migrated_')
  ) {
    return { conversationId, isNew: false };
  }

  // Create a new conversation
  const conversationMetadata: any = {
    ip_address: ipAddress,
    country,
    city,
    country_code: countryCode,
    region,
    device,
    browser,
    os,
    referer_url: referer,
    session_started_at: new Date().toISOString(),
    lead_id: leadId || null,
    tags: [],
    messages_count: 0,
    visited_pages: [] as Array<{ url: string; entered_at: string; duration_ms: number }>,
    visitor_id: visitorId || null,
  };

  // Add referrer journey if provided
  if (referrerJourney) {
    conversationMetadata.referrer_journey = {
      referrer_url: referrerJourney.referrer_url || null,
      landing_page: referrerJourney.landing_page || null,
      utm_source: referrerJourney.utm_source || null,
      utm_medium: referrerJourney.utm_medium || null,
      utm_campaign: referrerJourney.utm_campaign || null,
      utm_term: referrerJourney.utm_term || null,
      utm_content: referrerJourney.utm_content || null,
      entry_type: referrerJourney.entry_type || 'direct',
    };
    console.log('Added referrer journey to new conversation:', conversationMetadata.referrer_journey);
  }

  const { data: newConversation, error: createError } = await supabase
    .from('conversations')
    .insert({
      agent_id: agentId,
      user_id: agentUserId,
      status: 'active',
      metadata: conversationMetadata,
    })
    .select('id')
    .single();

  if (createError) {
    console.error('Error creating conversation:', createError);
    throw createError;
  }

  console.log(`Created new conversation: ${newConversation.id}`);
  return { conversationId: newConversation.id, isNew: true };
}

/**
 * Checks conversation status for human takeover or closed state.
 * Returns early response if conversation requires special handling.
 */
export async function checkConversationStatus(
  supabase: ReturnType<typeof createClient>,
  conversationId: string,
  messages: any[],
  previewMode: boolean
): Promise<ConversationCheckResult> {
  if (previewMode) {
    return { shouldReturn: false, conversation: null };
  }

  const { data: convData } = await supabase
    .from('conversations')
    .select('status, metadata')
    .eq('id', conversationId)
    .single();

  if (!convData) {
    return { shouldReturn: false };
  }

  // Handle human takeover status
  if (convData.status === 'human_takeover') {
    // Save user message without AI processing
    if (messages && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage.role === 'user') {
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          role: 'user',
          content: lastUserMessage.content,
          metadata: {
            source: 'widget',
            files: lastUserMessage.files || undefined,
          },
        });

        // Update conversation metadata
        const currentMetadata = convData.metadata || {};
        await supabase
          .from('conversations')
          .update({
            metadata: {
              ...currentMetadata,
              messages_count: (currentMetadata.messages_count || 0) + 1,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', conversationId);
      }
    }

    // Fetch takeover agent info
    const takenOverBy = await getTakeoverAgentInfo(supabase, conversationId);

    return {
      shouldReturn: true,
      response: new Response(
        JSON.stringify({
          conversationId,
          status: 'human_takeover',
          takenOverBy,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      ),
      conversation: convData,
    };
  }

  // Handle closed conversation
  if (convData.status === 'closed') {
    console.log('Conversation is closed, saving message but not calling AI');

    // Save user message
    if (messages && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage.role === 'user') {
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          role: 'user',
          content: lastUserMessage.content,
          metadata: {
            source: 'widget',
            files: lastUserMessage.files || undefined,
          },
        });
      }
    }

    return {
      shouldReturn: true,
      response: new Response(
        JSON.stringify({
          conversationId,
          status: 'closed',
          response:
            'This conversation has been closed. Please start a new conversation if you need further assistance.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      ),
      conversation: convData,
    };
  }

  return { shouldReturn: false, conversation: convData };
}

/**
 * Fetches takeover agent information for human takeover display.
 */
async function getTakeoverAgentInfo(
  supabase: ReturnType<typeof createClient>,
  conversationId: string
): Promise<TakeoverInfo | null> {
  const { data: takeover } = await supabase
    .from('conversation_takeovers')
    .select('taken_over_by')
    .eq('conversation_id', conversationId)
    .is('returned_to_ai_at', null)
    .order('taken_over_at', { ascending: false })
    .limit(1)
    .single();

  if (!takeover?.taken_over_by) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('user_id', takeover.taken_over_by)
    .single();

  if (profile) {
    return {
      name: profile.display_name || 'Team Member',
      avatar: profile.avatar_url,
    };
  }

  return null;
}

/**
 * Saves a user message and performs content moderation.
 * Returns early response if message is blocked.
 */
export async function saveUserMessage(
  supabase: ReturnType<typeof createClient>,
  options: {
    conversationId: string;
    message: { role: string; content: string; files?: any[] };
    isGreetingRequest: boolean;
    previewMode: boolean;
    requestId: string;
    agentId: string;
    moderateContent: (content: string) => Promise<{ action: string; categories: string[]; severity: string }>;
    conversationMetadata: any;
  }
): Promise<{
  userMessageId: string | undefined;
  isBlocked: boolean;
  blockResponse?: Response;
}> {
  const {
    conversationId,
    message,
    isGreetingRequest,
    previewMode,
    requestId,
    agentId,
    moderateContent,
    conversationMetadata,
  } = options;

  // Skip for greeting requests or preview mode
  if (isGreetingRequest || previewMode) {
    return { userMessageId: undefined, isBlocked: false };
  }

  if (message.role !== 'user') {
    return { userMessageId: undefined, isBlocked: false };
  }

  // Content moderation
  const moderation = await moderateContent(message.content);

  if (moderation.action === 'block') {
    console.warn(`[${requestId}] Content blocked: User message flagged for ${moderation.categories.join(', ')}`);

    // Log security event (fire and forget)
    supabase
      .from('security_logs')
      .insert({
        action: 'content_blocked',
        resource_type: 'conversation',
        resource_id: conversationId,
        success: true,
        details: {
          type: 'user_message',
          categories: moderation.categories,
          severity: moderation.severity,
          request_id: requestId,
          agent_id: agentId,
        },
      })
      .then(() => console.log(`[${requestId}] Security event logged: content_blocked (user)`))
      .catch((err) => console.error(`[${requestId}] Failed to log security event:`, err));

    return {
      userMessageId: undefined,
      isBlocked: true,
      blockResponse: new Response(
        JSON.stringify({
          conversationId,
          response: "I'm not able to respond to that type of message. How else can I help you today?",
          sources: [],
          status: 'active',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      ),
    };
  }

  if (moderation.action === 'warn') {
    console.warn(`[${requestId}] Content warning: User message flagged for ${moderation.categories.join(', ')}`);
    supabase
      .from('security_logs')
      .insert({
        action: 'content_warning',
        resource_type: 'conversation',
        resource_id: conversationId,
        success: true,
        details: {
          type: 'user_message',
          categories: moderation.categories,
          severity: moderation.severity,
          request_id: requestId,
          agent_id: agentId,
        },
      })
      .catch((err) => console.error(`[${requestId}] Failed to log content warning:`, err));
  }

  // Save the message
  const { data: userMsg, error: msgError } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role: 'user',
      content: message.content,
      metadata: {
        source: 'widget',
        files: message.files || undefined,
      },
    })
    .select('id')
    .single();

  if (msgError) {
    console.error('Error saving user message:', msgError);
  }

  // Update last_user_message_at
  const currentMeta = conversationMetadata || {};
  await supabase
    .from('conversations')
    .update({
      metadata: {
        ...currentMeta,
        last_user_message_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);

  return { userMessageId: userMsg?.id, isBlocked: false };
}
