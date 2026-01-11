/**
 * @fileoverview Knowledge Base TopBar Search Component
 * 
 * Encapsulates search state and results rendering for the Knowledge Base page.
 * Manages its own search query state to prevent parent re-renders.
 * 
 * @module components/knowledge-base/KBTopBarSearch
 */

import { useState, useCallback, memo } from 'react';
import { TopBarSearch } from '@/components/layout/TopBar';
import { KBSearchResults } from './KBSearchResults';
import type { KBCategory, KBArticle } from '@/config/knowledge-base-config';

interface KBTopBarSearchProps {
  /** Callback when an article is selected from search results */
  onSelect: (category: KBCategory, article: KBArticle) => void;
}

/**
 * Self-contained search component for the Knowledge Base page.
 * Manages search state internally to avoid triggering parent re-renders.
 */
export const KBTopBarSearch = memo(function KBTopBarSearch({
  onSelect,
}: KBTopBarSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const renderResults = useCallback((query: string) => (
    <KBSearchResults
      query={query}
      onSelect={onSelect}
    />
  ), [onSelect]);

  return (
    <TopBarSearch
      placeholder="Search articles..."
      value={searchQuery}
      onChange={setSearchQuery}
      renderResults={renderResults}
    />
  );
});
