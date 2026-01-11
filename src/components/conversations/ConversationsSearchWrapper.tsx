/**
 * @fileoverview Conversations Search Wrapper
 * 
 * Self-contained wrapper that fetches conversations internally,
 * preventing data dependencies from propagating to parent TopBar config.
 * 
 * @module components/conversations/ConversationsSearchWrapper
 */

import { memo, useRef, useEffect, useCallback } from 'react';
import { useInfiniteConversations } from '@/hooks/useInfiniteConversations';
import { ConversationsTopBarSearch } from './ConversationsTopBarSearch';
import type { Tables } from '@/integrations/supabase/types';

type Conversation = Tables<'conversations'> & {
  agents?: { name: string };
};

interface ConversationsSearchWrapperProps {
  /** Callback when a conversation is selected from search results */
  onSelect: (conversation: Conversation) => void;
}

/**
 * Wrapper component that fetches its own data to isolate
 * data dependencies from the parent's TopBar config.
 */
export const ConversationsSearchWrapper = memo(function ConversationsSearchWrapper({
  onSelect,
}: ConversationsSearchWrapperProps) {
  const { conversations } = useInfiniteConversations();
  
  // Keep onSelect stable via ref
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  });
  
  const handleSelect = useCallback((conversation: Conversation) => {
    onSelectRef.current(conversation);
  }, []);
  
  return (
    <ConversationsTopBarSearch
      conversations={conversations}
      onSelect={handleSelect}
    />
  );
});
