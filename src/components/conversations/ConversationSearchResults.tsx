/**
 * @fileoverview Conversation Search Results Component
 * 
 * Renders conversation search results for the TopBarSearch dropdown.
 * Filters conversations internally based on query to avoid parent re-renders.
 * 
 * @module components/conversations/ConversationSearchResults
 */

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { TopBarSearchResultItem, TopBarSearchEmptyState } from '@/components/layout/TopBarSearchResultItem';
import type { Tables } from '@/integrations/supabase/types';
import type { ConversationMetadata } from '@/types/metadata';

type Conversation = Tables<'conversations'> & {
  agents?: { name: string };
};

interface ConversationSearchResultsProps {
  /** Search query to filter conversations */
  query: string;
  /** All conversations to search through */
  conversations: Conversation[];
  /** Callback when a conversation is selected */
  onSelect: (conversation: Conversation) => void;
  /** Maximum number of results to show (default: 10) */
  maxResults?: number;
}

/**
 * Renders conversation search results in the TopBarSearch dropdown.
 * Filters conversations internally to avoid memoization issues in parent.
 */
export function ConversationSearchResults({
  query,
  conversations,
  onSelect,
  maxResults = 10,
}: ConversationSearchResultsProps) {
  // Filter conversations based on query - done here to avoid parent re-renders
  const filteredConversations = useMemo(() => {
    if (!query.trim()) return [];
    
    const q = query.toLowerCase();
    return conversations.filter((conv) => {
      const metadata = (conv.metadata || {}) as ConversationMetadata;
      return (
        metadata.lead_name?.toLowerCase().includes(q) ||
        metadata.lead_email?.toLowerCase().includes(q) ||
        metadata.lead_phone?.toLowerCase().includes(q) ||
        metadata.last_message_preview?.toLowerCase().includes(q)
      );
    }).slice(0, maxResults);
  }, [query, conversations, maxResults]);

  if (filteredConversations.length === 0) {
    return <TopBarSearchEmptyState message="No conversations found" />;
  }

  return (
    <>
      {filteredConversations.map((conv) => {
        const metadata = (conv.metadata || {}) as ConversationMetadata;
        
        return (
          <TopBarSearchResultItem
            key={conv.id}
            title={metadata.lead_name || metadata.lead_email || 'Anonymous Visitor'}
            subtitle={metadata.last_message_preview || 'No messages yet'}
            onClick={() => onSelect(conv)}
            statusIndicator={
              <div className={cn(
                "w-2 h-2 rounded-full",
                conv.status === 'active' && "bg-status-active",
                conv.status === 'human_takeover' && "bg-status-warning",
                conv.status === 'closed' && "bg-muted-foreground"
              )} />
            }
          />
        );
      })}
    </>
  );
}
