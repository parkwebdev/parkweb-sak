/**
 * Conversation Utility Functions
 * 
 * Shared utility functions for conversation management in the admin inbox.
 * Extracted from Conversations.tsx for reusability and maintainability.
 * 
 * @module lib/conversation-utils
 */

import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import type { ConversationMetadata } from '@/types/metadata';

type Conversation = Tables<'conversations'>;

/**
 * Get the appropriate CSS classes for a conversation status badge.
 * 
 * @param status - The conversation status
 * @returns CSS class string for the status badge
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-foreground text-background border-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

/**
 * Get a priority indicator element for a conversation.
 * 
 * @param priority - The priority level ('urgent', 'high', or undefined)
 * @returns JSX element for the priority indicator or null
 */
export function getPriorityIndicator(priority?: string): React.ReactNode {
  switch (priority) {
    case 'urgent':
      return React.createElement('span', { className: 'w-2 h-2 rounded-full bg-destructive' });
    case 'high':
      return React.createElement('span', { className: 'w-2 h-2 rounded-full bg-warning' });
    default:
      return null;
  }
}

/**
 * Calculate the unread message count for admin view.
 * Only counts user messages, not team member responses.
 * 
 * @param conversation - The conversation to check
 * @returns Number of unread messages (0 or 1 for indicator purposes)
 */
export function getUnreadCount(conversation: Conversation): number {
  const metadata = (conversation.metadata || {}) as ConversationMetadata;
  const lastReadAt = metadata?.admin_last_read_at;
  const lastUserMessageAt = metadata?.last_user_message_at;
  const lastMessageAt = metadata?.last_message_at;
  const lastMessageRole = metadata?.last_message_role;
  
  // Prefer last_user_message_at if available
  // Fallback to last_message_at only if last message wasn't from human team member
  const relevantMessageAt = lastUserMessageAt || 
    (lastMessageRole !== 'human' ? lastMessageAt : null);
  
  if (!relevantMessageAt) return 0;
  
  // Never read by admin - show indicator
  if (!lastReadAt) return 1;
  
  // New user messages since last read
  return new Date(relevantMessageAt) > new Date(lastReadAt) ? 1 : 0;
}

/**
 * Format a URL for display in the conversation list.
 * Truncates long paths and handles invalid URLs gracefully.
 * 
 * @param url - The URL to format
 * @returns Formatted URL string for display
 */
export function formatUrl(url: string): string {
  try {
    const parsed = new URL(url);
    let path = parsed.pathname;
    if (path === '/') return '/';
    return path.length > 25 ? path.substring(0, 22) + '...' : path;
  } catch {
    return url.length > 25 ? url.substring(0, 22) + '...' : url;
  }
}

/**
 * Update a message reaction via edge function.
 * 
 * @param messageId - The message ID to update
 * @param emoji - The emoji to add/remove
 * @param action - Whether to 'add' or 'remove' the reaction
 * @param reactorType - Whether the reactor is a 'user' or 'admin'
 * @returns Object indicating success or failure
 */
export async function updateMessageReaction(
  messageId: string,
  emoji: string,
  action: 'add' | 'remove',
  reactorType: 'user' | 'admin'
): Promise<{ success: boolean }> {
  try {
    const { error } = await supabase.functions.invoke('update-message-reaction', {
      body: { messageId, emoji, action, reactorType },
    });
    return error ? { success: false } : { success: true };
  } catch {
    return { success: false };
  }
}
