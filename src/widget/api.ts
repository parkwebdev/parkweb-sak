/**
 * @fileoverview Widget API Module
 * 
 * Provides all API functions for the embedded chat widget including:
 * - Widget configuration fetching
 * - Lead creation and management
 * - Chat messaging with AI/human agents
 * - Real-time subscriptions for messages, status, and typing indicators
 * - Visitor presence tracking for admin panel
 * - Article feedback submission
 * - Page visit analytics updates
 * 
 * Uses Supabase for database operations and real-time subscriptions.
 * All functions are designed to be called from the widget iframe context.
 * 
 * @module widget/api
 */

import { createClient } from '@supabase/supabase-js';
import type { RealtimeChannel } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mvaimvwdukpgvkifkfpa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12YWltdndkdWtwZ3ZraWZrZnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzI3MTYsImV4cCI6MjA3Mjc0ODcxNn0.DmeecDZcGids_IjJQQepFVQK5wdEdV0eNXDCTRzQtQo';

/**
 * Supabase client configured for widget use.
 * Uses unique storage key to prevent "Multiple GoTrueClient instances" warning.
 * Session persistence and auto-refresh are disabled for anonymous widget context.
 */
export const widgetSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storageKey: 'chatpad-widget-auth',
    persistSession: false,
    autoRefreshToken: false,
  }
});

/**
 * Complete widget configuration object containing all display,
 * behavior, and content settings for the embedded chat widget.
 */
export interface WidgetConfig {
  // Agent info
  agentId: string;
  agentName: string;
  userId: string;
  
  // Display settings
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  primaryColor: string;
  useGradientHeader: boolean;
  gradientStartColor: string;
  gradientEndColor: string;
  
  // Hero section
  welcomeTitle: string;
  welcomeSubtitle: string;
  welcomeEmoji?: string;
  showTeamAvatars: boolean;
  teamAvatarUrls: string[];
  
  // Messages
  placeholder: string;
  
  // Widget button
  animation: 'none' | 'pulse' | 'bounce' | 'fade' | 'ring';
  buttonAnimation?: 'none' | 'pulse' | 'bounce' | 'fade' | 'ring';
  
  // Navigation
  enableHomeTab: boolean;
  enableMessagesTab: boolean;
  enableHelpTab: boolean;
  enableNewsTab: boolean;
  showBottomNav: boolean;
  
  // Contact form
  enableContactForm: boolean;
  contactFormTitle: string;
  contactFormSubtitle?: string;
  customFields: Array<{
    id: string;
    label: string;
    fieldType: 'text' | 'email' | 'phone' | 'textarea' | 'select';
    required: boolean;
    options?: string[];
  }>;
  
  // Quick actions
  quickActions: Array<{
    id: string;
    label: string;
    title?: string;
    subtitle?: string;
    icon: string;
    actionType: string;
    action?: string;
  }>;
  
  // Announcements
  announcements: Array<{
    id: string;
    title: string;
    subtitle?: string;
    image_url?: string;
    background_color: string;
    title_color: string;
    action_type?: string;
    action_url?: string;
  }>;
  
  // Help center
  helpCategories: Array<{
    id: string;
    name: string;
    description?: string;
    icon?: string;
  }>;
  helpArticles: Array<{
    id: string;
    category_id: string;
    category?: string;
    title: string;
    content: string;
    icon?: string;
    order?: number;
    featured_image?: string;
  }>;
  
  // News items
  newsItems: Array<{
    id: string;
    title: string;
    body: string;
    featured_image_url?: string;
    author_name?: string;
    author_avatar?: string;
    published_at?: string;
  }>;
  // Features
  enableVoiceMessages: boolean;
  enableFileAttachments: boolean;
  allowedFileTypes: string[];
  enableMessageReactions: boolean;
  showReadReceipts: boolean;
  
  // Branding
  showBranding: boolean;
}

/**
 * Fetches the complete widget configuration for an agent.
 * 
 * @param agentId - The unique identifier of the agent
 * @returns Promise resolving to the complete widget configuration
 * @throws Error if the fetch request fails
 * 
 * @example
 * ```ts
 * const config = await fetchWidgetConfig('agent-uuid');
 * console.log(config.welcomeTitle);
 * ```
 */
export const fetchWidgetConfig = async (agentId: string): Promise<WidgetConfig> => {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/get-widget-config?agentId=${agentId}`,
    {
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch widget config');
  }

  return response.json();
};

/**
 * Creates a new lead from the widget contact form submission.
 * Also creates an associated conversation linked to the lead.
 * 
 * @param agentId - The agent ID to associate the lead with
 * @param data - Lead data including name, email, and custom fields
 * @param data.firstName - The lead's first name
 * @param data.lastName - The lead's last name
 * @param data.email - The lead's email address
 * @param data.customFields - Additional custom form field values
 * @param data._formLoadTime - Optional spam protection timestamp
 * @returns Promise with the created lead ID and conversation ID
 * @throws Error if lead creation fails
 * 
 * @example
 * ```ts
 * const { leadId, conversationId } = await createLead('agent-uuid', {
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   email: 'john@example.com',
 *   customFields: { company: 'Acme Inc' }
 * });
 * ```
 */
export async function createLead(agentId: string, data: {
  firstName: string;
  lastName: string;
  email: string;
  customFields: Record<string, any>;
  _formLoadTime?: number; // Spam protection: timestamp when form was loaded
}): Promise<{ leadId: string; conversationId: string | null }> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/create-widget-lead`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      agentId,
      ...data,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create lead');
  }

  return response.json();
}

/**
 * Submits user feedback for a help article.
 * Used to track article helpfulness and collect improvement suggestions.
 * 
 * @param articleId - The help article ID
 * @param data - Feedback data
 * @param data.sessionId - The widget session ID for deduplication
 * @param data.isHelpful - Whether the article was helpful
 * @param data.comment - Optional feedback comment
 * @throws Error if feedback submission fails
 * 
 * @example
 * ```ts
 * await submitArticleFeedback('article-uuid', {
 *   sessionId: 'session-123',
 *   isHelpful: true,
 *   comment: 'Very helpful, thanks!'
 * });
 * ```
 */
export async function submitArticleFeedback(articleId: string, data: {
  sessionId: string;
  isHelpful: boolean;
  comment?: string;
}): Promise<void> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/submit-article-feedback`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      articleId,
      ...data,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to submit feedback');
  }
}

/**
 * Response object from chat message API calls.
 */
export interface ChatResponse {
  conversationId: string;
  response: string;
  /** Chunked messages for staggered display (new multi-message format) */
  messages?: Array<{
    id: string;
    content: string;
    chunkIndex: number;
  }>;
  status?: 'active' | 'human_takeover' | 'closed';
  message?: string;
  takenOverBy?: { name: string; avatar?: string };
  userMessageId?: string;
  assistantMessageId?: string;
  sources?: Array<{ source: string; type: string; similarity: number }>;
  linkPreviews?: Array<{
    url: string;
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
    favicon?: string;
    domain: string;
    videoType?: string;
    videoId?: string;
    embedUrl?: string;
  }>;
  quickReplies?: string[];
  /** Signal that AI marked conversation complete with high confidence - triggers rating prompt */
  aiMarkedComplete?: boolean;
}

/**
 * Fetches the current takeover agent information for a conversation.
 * Used to display agent name and avatar during human takeover.
 * 
 * @param conversationId - The conversation ID to check
 * @returns Promise with agent info or null if no takeover is active
 * 
 * @example
 * ```ts
 * const agent = await fetchTakeoverAgent('conv-uuid');
 * if (agent) {
 *   console.log(`Chatting with ${agent.name}`);
 * }
 * ```
 */
export async function fetchTakeoverAgent(conversationId: string): Promise<{ name: string; avatar?: string } | null> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/get-takeover-agent`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversationId }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.agent || null;
  } catch (error) {
    console.error('Error fetching takeover agent:', error);
    return null;
  }
}

/**
 * Referrer and UTM tracking data for visitor journey analytics.
 */
export interface ReferrerJourney {
  referrer_url: string | null;
  landing_page: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  entry_type: 'direct' | 'organic' | 'referral' | 'social' | 'paid' | 'email';
}

/**
 * Sends a chat message to the AI agent or human operator.
 * Creates a new conversation if conversationId is null.
 * Includes optional analytics data for visitor tracking.
 * 
 * @param agentId - The agent ID to send the message to
 * @param conversationId - Existing conversation ID or null for new conversation
 * @param messages - Array of message objects with role and content
 * @param leadId - Optional lead ID to associate with the conversation
 * @param pageVisits - Optional page visit analytics data
 * @param referrerJourney - Optional referrer/UTM tracking data
 * @param visitorId - Optional visitor ID for analytics
 * @returns Promise with the chat response including AI response and metadata
 * @throws Error if the message fails to send
 * 
 * @example
 * ```ts
 * const response = await sendChatMessage(
 *   'agent-uuid',
 *   null, // New conversation
 *   [{ role: 'user', content: 'Hello!' }],
 *   'lead-uuid'
 * );
 * console.log(response.response); // AI response
 * ```
 */
/**
 * Callback handlers for streaming chat responses.
 */
export interface StreamingCallbacks {
  /** Called when the stream initializes with conversation/message IDs */
  onInit?: (data: { conversationId: string; userMessageId?: string }) => void;
  /** Called for each content token as it arrives */
  onDelta?: (content: string) => void;
  /** Called when a chunk is complete (sentence boundary, link isolation) - triggers new bubble */
  onChunkComplete?: (data: { content: string; chunkIndex: number; isLink: boolean; isFinal?: boolean }) => void;
  /** Called when a tool starts executing */
  onToolStart?: (toolName: string) => void;
  /** Called when a link preview is ready (pre-fetched during streaming) */
  onLinkPreview?: (preview: any) => void;
  /** Called when the stream completes with final metadata */
  onComplete?: (data: {
    assistantMessageId?: string;
    linkPreviews?: ChatResponse['linkPreviews'];
    quickReplies?: string[];
    aiMarkedComplete?: boolean;
    sources?: Array<{ source: string; type: string; similarity: number }>;
    chunkIds?: string[]; // IDs of saved chunk messages
  }) => void;
  /** Called on stream error */
  onError?: (error: Error) => void;
}

/**
 * Sends a chat message with SSE streaming response.
 * Tokens are delivered in real-time as they're generated by the AI.
 * 
 * @param agentId - The agent ID to send the message to
 * @param conversationId - Existing conversation ID or null for new conversation
 * @param messages - Array of message objects with role and content
 * @param callbacks - Streaming event callbacks
 * @param options - Additional options (leadId, pageVisits, etc.)
 */
export async function sendChatMessageStreaming(
  agentId: string, 
  conversationId: string | null, 
  messages: Array<{ role: string; content: string; files?: Array<{ name: string; url: string; type: string; size: number }> }>,
  callbacks: StreamingCallbacks,
  options?: {
    leadId?: string;
    pageVisits?: Array<{ url: string; entered_at: string; duration_ms: number }>;
    referrerJourney?: ReferrerJourney;
    visitorId?: string;
  }
): Promise<void> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/widget-chat`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      agentId,
      conversationId,
      messages,
      leadId: options?.leadId,
      pageVisits: options?.pageVisits,
      referrerJourney: options?.referrerJourney,
      visitorId: options?.visitorId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to send message');
  }

  if (!response.body) {
    throw new Error('No response body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete lines
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        
        // Handle CRLF
        if (line.endsWith('\r')) line = line.slice(0, -1);
        
        // Skip empty lines and comments
        if (!line || line.startsWith(':')) continue;
        if (!line.startsWith('data: ')) continue;
        
        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') continue;
        
        try {
          const data = JSON.parse(jsonStr);
          
          switch (data.type) {
            case 'init':
              callbacks.onInit?.({ 
                conversationId: data.conversationId, 
                userMessageId: data.userMessageId 
              });
              break;
            case 'delta':
              callbacks.onDelta?.(data.content);
              break;
            case 'chunk_complete':
              callbacks.onChunkComplete?.({
                content: data.content,
                chunkIndex: data.chunkIndex,
                isLink: data.isLink || false,
                isFinal: data.isFinal || false,
              });
              break;
            case 'tool_start':
              callbacks.onToolStart?.(data.name);
              break;
            case 'link_preview':
              // Link preview pre-fetched during streaming - immediately available
              callbacks.onLinkPreview?.(data.preview);
              break;
            case 'done':
              callbacks.onComplete?.({
                assistantMessageId: data.assistantMessageId,
                linkPreviews: data.linkPreviews,
                quickReplies: data.quickReplies,
                aiMarkedComplete: data.aiMarkedComplete,
                sources: data.sources,
                chunkIds: data.chunkIds,
              });
              break;
            case 'error':
              callbacks.onError?.(new Error(data.message));
              break;
          }
        } catch (e) {
          // Ignore parse errors for partial JSON
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Legacy non-streaming chat message function.
 * @deprecated Use sendChatMessageStreaming for real-time token display.
 */
export async function sendChatMessage(
  agentId: string, 
  conversationId: string | null, 
  messages: Array<{ role: string; content: string; files?: Array<{ name: string; url: string; type: string; size: number }> }>,
  leadId?: string,
  pageVisits?: Array<{ url: string; entered_at: string; duration_ms: number }>,
  referrerJourney?: ReferrerJourney,
  visitorId?: string
): Promise<ChatResponse> {
  // Use streaming internally but collect the full response
  return new Promise((resolve, reject) => {
    let content = '';
    let conversationIdResult = conversationId || '';
    let metadata: any = {};
    
    sendChatMessageStreaming(agentId, conversationId, messages, {
      onInit: (data) => {
        conversationIdResult = data.conversationId;
      },
      onDelta: (delta) => {
        content += delta;
      },
      onComplete: (data) => {
        metadata = data;
        resolve({
          conversationId: conversationIdResult,
          response: content,
          assistantMessageId: data.assistantMessageId,
          linkPreviews: data.linkPreviews,
          quickReplies: data.quickReplies,
          aiMarkedComplete: data.aiMarkedComplete,
          sources: data.sources,
        });
      },
      onError: (error) => {
        reject(error);
      },
    }, { leadId, pageVisits, referrerJourney, visitorId }).catch(reject);
  });
}

/**
 * Updates page visit analytics for an active conversation.
 * Called in real-time as users navigate pages without requiring a message.
 * 
 * @param conversationId - The active conversation ID
 * @param pageVisit - Page visit data including URL, timestamp, and duration
 * @param referrerJourney - Optional referrer tracking data
 * @param visitorId - Optional visitor ID for correlation
 * @returns Promise indicating success or failure
 * 
 * @example
 * ```ts
 * await updatePageVisit('conv-uuid', {
 *   url: '/pricing',
 *   entered_at: new Date().toISOString(),
 *   duration_ms: 5000
 * });
 * ```
 */
export async function updatePageVisit(
  conversationId: string,
  pageVisit: { url: string; entered_at: string; duration_ms: number; previous_duration_ms?: number },
  referrerJourney?: ReferrerJourney,
  visitorId?: string
): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/update-page-visits`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId,
        pageVisit,
        referrerJourney,
        visitorId,
      }),
    });

    if (!response.ok) {
      console.error('Failed to update page visit');
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating page visit:', error);
    return { success: false };
  }
}

/**
 * Fetches all messages for a conversation from the database.
 * Used to restore conversation history when widget is reopened.
 * 
 * @param conversationId - The conversation ID to fetch messages for
 * @returns Promise with array of message objects ordered by creation time
 * 
 * @example
 * ```ts
 * const messages = await fetchConversationMessages('conv-uuid');
 * messages.forEach(msg => console.log(`${msg.role}: ${msg.content}`));
 * ```
 */
export async function fetchConversationMessages(conversationId: string): Promise<Array<{
  id: string;
  role: string;
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}>> {
  try {
    const { data, error } = await widgetSupabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Widget API] Error fetching messages:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[Widget API] Error fetching messages:', error);
    return [];
  }
}

/**
 * Marks messages in a conversation as read.
 * Updates read timestamps for either user or admin reader type.
 * 
 * @param conversationId - The conversation ID
 * @param readerType - Whether the reader is 'user' or 'admin'
 * @returns Promise with success status and count of updated messages
 * 
 * @example
 * ```ts
 * const result = await markMessagesRead('conv-uuid', 'user');
 * console.log(`Marked ${result.updated} messages as read`);
 * ```
 */
export async function markMessagesRead(
  conversationId: string,
  readerType: 'user' | 'admin'
): Promise<{ success: boolean; updated?: number }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/mark-messages-read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversationId, readerType }),
    });

    if (!response.ok) {
      console.error('Failed to mark messages as read');
      return { success: false };
    }

    return response.json();
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return { success: false };
  }
}

/** Reaction structure returned from the API */
export interface WidgetMessageReaction {
  emoji: string;
  count: number;
  userReacted?: boolean;
  adminReacted?: boolean;
}

/**
 * Adds or removes an emoji reaction on a message.
 * Persists to database and syncs in real-time.
 * 
 * @param messageId - The message ID to react to
 * @param emoji - The emoji character to add/remove
 * @param action - Whether to 'add' or 'remove' the reaction
 * @param reactorType - Whether the reactor is 'user' or 'admin'
 * @returns Promise with success status and updated reactions array
 * 
 * @example
 * ```ts
 * await updateMessageReaction('msg-uuid', '👍', 'add', 'user');
 * ```
 */
export async function updateMessageReaction(
  messageId: string,
  emoji: string,
  action: 'add' | 'remove',
  reactorType: 'user' | 'admin'
): Promise<{ success: boolean; reactions?: WidgetMessageReaction[] }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/update-message-reaction`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messageId, emoji, action, reactorType }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Failed to update reaction:', error);
      return { success: false };
    }

    return response.json();
  } catch (error) {
    console.error('Error updating reaction:', error);
    return { success: false };
  }
}

/**
 * Subscribes to real-time message updates for a conversation.
 * Receives INSERT events for new messages and UPDATE events for edits/reactions.
 * 
 * @param conversationId - The conversation ID to subscribe to
 * @param onMessage - Callback fired when a new assistant message is received
 * @param onMessageUpdate - Optional callback for message updates (reactions, etc.)
 * @returns RealtimeChannel that can be passed to unsubscribeFromMessages
 * 
 * @example
 * ```ts
 * const channel = subscribeToMessages('conv-uuid', 
 *   (msg) => console.log('New message:', msg.content),
 *   (update) => console.log('Message updated:', update.id)
 * );
 * // Later: unsubscribeFromMessages(channel);
 * ```
 */
export function subscribeToMessages(
  conversationId: string,
  onMessage: (message: { id: string; role: string; content: string; metadata: Record<string, unknown> | null; created_at: string }) => void,
  onMessageUpdate?: (message: { id: string; metadata: Record<string, unknown> | null }) => void
): RealtimeChannel {
  console.log('[Widget] Subscribing to messages for conversation:', conversationId);
  
  const channel = widgetSupabase
    .channel(`widget-messages-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        console.log('[Widget] New message received:', payload);
        const newMessage = payload.new as { id: string; role: string; content: string; metadata: Record<string, unknown> | null; created_at: string };
        // Only notify for assistant messages (from human or AI)
        if (newMessage.role === 'assistant') {
          onMessage({
            id: newMessage.id,
            role: newMessage.role,
            content: newMessage.content,
            metadata: newMessage.metadata,
            created_at: newMessage.created_at,
          });
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        console.log('[Widget] Message updated:', payload);
        const updatedMessage = payload.new as { id: string; metadata: Record<string, unknown> | null };
        if (onMessageUpdate) {
          onMessageUpdate({
            id: updatedMessage.id,
            metadata: updatedMessage.metadata,
          });
        }
      }
    )
    .subscribe((status, err) => {
      console.log('[Widget] Subscription status:', status);
      if (err) {
        console.error('[Widget] Subscription error:', err);
      }
      if (status === 'CHANNEL_ERROR') {
        console.error('[Widget] Channel error - real-time updates may not work');
      }
    });

  return channel;
}

/**
 * Unsubscribes from a message subscription channel.
 * Should be called when leaving a conversation or unmounting.
 * 
 * @param channel - The RealtimeChannel returned by subscribeToMessages
 */
export function unsubscribeFromMessages(channel: RealtimeChannel) {
  console.log('[Widget] Unsubscribing from messages');
  widgetSupabase.removeChannel(channel);
}

/**
 * Subscribes to conversation status changes (active, human_takeover, closed).
 * Used to detect when a team member takes over or closes a conversation.
 * 
 * @param conversationId - The conversation ID to monitor
 * @param onStatusChange - Callback fired when status changes
 * @returns RealtimeChannel that can be passed to unsubscribeFromConversationStatus
 * 
 * @example
 * ```ts
 * const channel = subscribeToConversationStatus('conv-uuid', (status) => {
 *   if (status === 'human_takeover') {
 *     console.log('A team member has joined!');
 *   }
 * });
 * ```
 */
export function subscribeToConversationStatus(
  conversationId: string,
  onStatusChange: (status: 'active' | 'human_takeover' | 'closed') => void
): RealtimeChannel {
  console.log('[Widget] Subscribing to conversation status for:', conversationId);
  
  const channel = widgetSupabase
    .channel(`widget-conv-status-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations',
        filter: `id=eq.${conversationId}`,
      },
      (payload) => {
        console.log('[Widget] Conversation status changed:', payload);
        const newStatus = (payload.new as { status: 'active' | 'human_takeover' | 'closed' }).status;
        if (newStatus) {
          onStatusChange(newStatus);
        }
      }
    )
    .subscribe((status) => {
      console.log('[Widget] Conversation status subscription:', status);
    });

  return channel;
}

/**
 * Unsubscribes from a conversation status subscription.
 * 
 * @param channel - The RealtimeChannel returned by subscribeToConversationStatus
 */
export function unsubscribeFromConversationStatus(channel: RealtimeChannel) {
  console.log('[Widget] Unsubscribing from conversation status');
  widgetSupabase.removeChannel(channel);
}

/**
 * Subscribes to typing indicators using Supabase Presence.
 * Detects when a team member is typing a response.
 * 
 * @param conversationId - The conversation ID to monitor
 * @param onTypingChange - Callback with typing state and optional agent name
 * @returns RealtimeChannel that can be passed to unsubscribeFromTypingIndicator
 * 
 * @example
 * ```ts
 * const channel = subscribeToTypingIndicator('conv-uuid', (isTyping, agentName) => {
 *   if (isTyping) {
 *     console.log(`${agentName} is typing...`);
 *   }
 * });
 * ```
 */
export function subscribeToTypingIndicator(
  conversationId: string,
  onTypingChange: (isTyping: boolean, agentName?: string) => void
): RealtimeChannel {
  console.log('[Widget] Subscribing to typing indicator for:', conversationId);
  
  const channel = widgetSupabase
    .channel(`typing-${conversationId}`)
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      // Check if any agent is typing
      const allUsers = Object.values(state).flat() as Array<{ isTyping?: boolean; name?: string }>;
      const typingUsers = allUsers.filter((user) => user.isTyping);
      const isAgentTyping = typingUsers.length > 0;
      const agentName = typingUsers[0]?.name;
      onTypingChange(isAgentTyping, agentName);
    })
    .subscribe((status) => {
      console.log('[Widget] Typing indicator subscription status:', status);
    });

  return channel;
}

/**
 * Unsubscribes from a typing indicator subscription.
 * 
 * @param channel - The RealtimeChannel returned by subscribeToTypingIndicator
 */
export function unsubscribeFromTypingIndicator(channel: RealtimeChannel) {
  console.log('[Widget] Unsubscribing from typing indicator');
  widgetSupabase.removeChannel(channel);
}

/**
 * Starts visitor presence tracking for the admin panel.
 * Allows admins to see active visitors on their site in real-time.
 * 
 * @param agentId - The agent ID to track visitors for
 * @param visitorId - Unique identifier for this visitor session
 * @param options - Presence metadata options
 * @param options.currentPage - The page URL the visitor is on
 * @param options.isWidgetOpen - Whether the widget is currently open
 * @param options.leadName - Optional lead name if contact form was filled
 * @param options.leadEmail - Optional lead email if contact form was filled
 * @returns RealtimeChannel for updating or stopping presence
 * 
 * @example
 * ```ts
 * const channel = startVisitorPresence('agent-uuid', 'visitor-123', {
 *   currentPage: '/pricing',
 *   isWidgetOpen: true,
 *   leadName: 'John Doe'
 * });
 * ```
 */
export function startVisitorPresence(
  agentId: string,
  visitorId: string,
  options: {
    currentPage: string;
    isWidgetOpen: boolean;
    leadName?: string;
    leadEmail?: string;
  }
): RealtimeChannel {
  console.log('[Widget] Starting visitor presence for agent:', agentId);
  
  const channel = widgetSupabase.channel(`visitor-presence-${agentId}`);
  
  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        visitorId,
        currentPage: options.currentPage,
        isWidgetOpen: options.isWidgetOpen,
        leadName: options.leadName,
        leadEmail: options.leadEmail,
        startedAt: new Date().toISOString(),
      });
    }
  });

  return channel;
}

/**
 * Updates the visitor presence with new page or widget state.
 * Called when visitor navigates to a new page or opens/closes the widget.
 * 
 * @param channel - The presence channel from startVisitorPresence
 * @param visitorId - The visitor's unique identifier
 * @param options - Updated presence metadata
 * 
 * @example
 * ```ts
 * await updateVisitorPresence(channel, 'visitor-123', {
 *   currentPage: '/features',
 *   isWidgetOpen: false
 * });
 * ```
 */
export async function updateVisitorPresence(
  channel: RealtimeChannel,
  visitorId: string,
  options: {
    currentPage: string;
    isWidgetOpen: boolean;
    leadName?: string;
    leadEmail?: string;
  }
): Promise<void> {
  try {
    await channel.track({
      visitorId,
      currentPage: options.currentPage,
      isWidgetOpen: options.isWidgetOpen,
      leadName: options.leadName,
      leadEmail: options.leadEmail,
      startedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Widget] Error updating presence:', error);
  }
}

/**
 * Stops visitor presence tracking and removes the channel.
 * Called when the widget is fully unloaded.
 * 
 * @param channel - The presence channel to stop
 */
export function stopVisitorPresence(channel: RealtimeChannel) {
  console.log('[Widget] Stopping visitor presence');
  widgetSupabase.removeChannel(channel);
}

/**
 * Submits a satisfaction rating for a conversation.
 * 
 * @param conversationId - The conversation ID to rate
 * @param rating - Rating from 1-5 stars
 * @param triggerType - What triggered the rating prompt
 * @param feedback - Optional text feedback
 * @returns Promise indicating success
 * 
 * @example
 * ```ts
 * await submitConversationRating('conv-uuid', 5, 'ai_marked_complete', 'Great help!');
 * ```
 */
export async function submitConversationRating(
  conversationId: string,
  rating: number,
  triggerType: 'team_closed' | 'ai_marked_complete',
  feedback?: string
): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/submit-rating`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId,
        rating,
        triggerType,
        feedback,
      }),
    });

    if (!response.ok) {
      console.error('Failed to submit rating');
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error('Error submitting rating:', error);
    return { success: false };
  }
}
