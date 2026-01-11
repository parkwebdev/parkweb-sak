/**
 * @fileoverview Conversation Search Results Component
 * 
 * Renders conversation search results for the TopBarSearch dropdown.
 * 
 * @module components/conversations/ConversationSearchResults
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { TopBarSearchResultItem, TopBarSearchEmptyState } from '@/components/layout/TopBarSearchResultItem';
import type { Tables } from '@/integrations/supabase/types';
import type { ConversationMetadata } from '@/types/metadata';

type Conversation = Tables<'conversations'> & {
  agents?: { name: string };
};

interface ConversationSearchResultsProps {
  /** Filtered conversations to display */
  conversations: Conversation[];
  /** Callback when a conversation is selected */
  onSelect: (conversation: Conversation) => void;
  /** Maximum number of results to show (default: 10) */
  maxResults?: number;
}

/**
 * Renders conversation search results in the TopBarSearch dropdown.
 */
export function ConversationSearchResults({
  conversations,
  onSelect,
  maxResults = 10,
}: ConversationSearchResultsProps) {
  if (conversations.length === 0) {
    return <TopBarSearchEmptyState message="No conversations found" />;
  }

  return (
    <>
      {conversations.slice(0, maxResults).map((conv) => {
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
