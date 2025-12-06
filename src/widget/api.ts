import { createClient } from '@supabase/supabase-js';
import type { RealtimeChannel } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mvaimvwdukpgvkifkfpa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12YWltdndkdWtwZ3ZraWZrZnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzI3MTYsImV4cCI6MjA3Mjc0ODcxNn0.DmeecDZcGids_IjJQQepFVQK5wdEdV0eNXDCTRzQtQo';

// Create a Supabase client for real-time subscriptions
// Uses unique storage key to prevent "Multiple GoTrueClient instances" warning
export const widgetSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storageKey: 'chatpad-widget-auth',
    persistSession: false,
    autoRefreshToken: false,
  }
});

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
  
  // Greetings and messages
  greeting: string;
  placeholder: string;
  
  // Widget button
  animation: 'none' | 'pulse' | 'bounce' | 'fade' | 'ring';
  buttonAnimation?: 'none' | 'pulse' | 'bounce' | 'fade' | 'ring';
  
  // Navigation
  enableHomeTab: boolean;
  enableMessagesTab: boolean;
  enableHelpTab: boolean;
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
  
  // Features
  enableVoiceMessages: boolean;
  enableFileAttachments: boolean;
  allowedFileTypes: string[];
  enableMessageReactions: boolean;
  showReadReceipts: boolean;
  
  // Branding
  showBranding: boolean;
}

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

export interface ChatResponse {
  conversationId: string;
  response: string;
  status?: 'active' | 'human_takeover' | 'closed';
  message?: string;
  takenOverBy?: { name: string; avatar?: string };
  userMessageId?: string;
  assistantMessageId?: string;
  sources?: Array<{ source: string; type: string; similarity: number }>;
}

// Fetch the current takeover agent for a conversation
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

export async function sendChatMessage(
  agentId: string, 
  conversationId: string | null, 
  messages: Array<{ role: string; content: string }>,
  leadId?: string,
  pageVisits?: Array<{ url: string; entered_at: string; duration_ms: number }>,
  referrerJourney?: ReferrerJourney,
  visitorId?: string
): Promise<ChatResponse> {
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
      leadId,
      pageVisits,
      referrerJourney,
      visitorId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to send message');
  }

  return response.json();
}

// Update page visits in real-time (without requiring a message)
export async function updatePageVisit(
  conversationId: string,
  pageVisit: { url: string; entered_at: string; duration_ms: number; previous_duration_ms?: number },
  referrerJourney?: ReferrerJourney
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

// Update message reaction (persist to database)
export async function updateMessageReaction(
  messageId: string,
  emoji: string,
  action: 'add' | 'remove',
  reactorType: 'user' | 'admin'
): Promise<{ success: boolean; reactions?: any[] }> {
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

// Subscribe to real-time messages for a conversation (INSERT and UPDATE events)
export function subscribeToMessages(
  conversationId: string,
  onMessage: (message: { id: string; role: string; content: string; metadata: any; created_at: string }) => void,
  onMessageUpdate?: (message: { id: string; metadata: any }) => void
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
        const newMessage = payload.new as any;
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
        const updatedMessage = payload.new as any;
        if (onMessageUpdate) {
          onMessageUpdate({
            id: updatedMessage.id,
            metadata: updatedMessage.metadata,
          });
        }
      }
    )
    .subscribe((status) => {
      console.log('[Widget] Subscription status:', status);
    });

  return channel;
}

export function unsubscribeFromMessages(channel: RealtimeChannel) {
  console.log('[Widget] Unsubscribing from messages');
  widgetSupabase.removeChannel(channel);
}

// Subscribe to real-time conversation status changes (for human takeover)
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
        const newStatus = (payload.new as any).status;
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

export function unsubscribeFromConversationStatus(channel: RealtimeChannel) {
  console.log('[Widget] Unsubscribing from conversation status');
  widgetSupabase.removeChannel(channel);
}

// Subscribe to typing indicators using Supabase Presence
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

export function unsubscribeFromTypingIndicator(channel: RealtimeChannel) {
  console.log('[Widget] Unsubscribing from typing indicator');
  widgetSupabase.removeChannel(channel);
}

// Visitor presence tracking for admin panel
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

export function stopVisitorPresence(channel: RealtimeChannel) {
  console.log('[Widget] Stopping visitor presence');
  widgetSupabase.removeChannel(channel);
}
