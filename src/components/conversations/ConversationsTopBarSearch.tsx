/**
 * @fileoverview Conversations TopBar Search Component
 * 
 * Encapsulates search state and results rendering for the Conversations page.
 * Manages its own search query state to prevent parent re-renders.
 * 
 * @module components/conversations/ConversationsTopBarSearch
 */

import { useState, useCallback, memo, useRef, useEffect } from 'react';
import { TopBarSearch } from '@/components/layout/TopBar';
import { ConversationSearchResults } from './ConversationSearchResults';
import type { Tables } from '@/integrations/supabase/types';

type Conversation = Tables<'conversations'> & {
  agents?: { name: string };
};

interface ConversationsTopBarSearchProps {
  /** All conversations to search through */
  conversations: Conversation[];
  /** Callback when a conversation is selected from search results */
  onSelect: (conversation: Conversation) => void;
}

/**
 * Self-contained search component for the Conversations page.
 * Manages search state internally to avoid triggering parent re-renders.
 * Uses refs for data props to ensure stable renderResults callback.
 */
export const ConversationsTopBarSearch = memo(function ConversationsTopBarSearch({
  conversations,
  onSelect,
}: ConversationsTopBarSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Use refs to avoid closure issues and keep renderResults stable
  const conversationsRef = useRef(conversations);
  const onSelectRef = useRef(onSelect);
  
  // Keep refs updated with latest values
  useEffect(() => {
    conversationsRef.current = conversations;
    onSelectRef.current = onSelect;
  });
  
  // Stable renderResults with empty deps - reads from refs
  const renderResults = useCallback((query: string) => (
    <ConversationSearchResults
      query={query}
      conversations={conversationsRef.current}
      onSelect={onSelectRef.current}
    />
  ), []);

  return (
    <TopBarSearch
      placeholder="Search conversations..."
      value={searchQuery}
      onChange={setSearchQuery}
      renderResults={renderResults}
    />
  );
});
