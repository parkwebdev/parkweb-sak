/**
 * @fileoverview Knowledge TopBar Search Component
 * 
 * Encapsulates search state and results rendering for the Admin Knowledge page.
 * Manages its own search query state to prevent parent re-renders.
 * 
 * @module components/admin/knowledge/KnowledgeTopBarSearch
 */

import { useState, useCallback, memo, useRef, useEffect } from 'react';
import { TopBarSearch } from '@/components/layout/TopBar';
import { KnowledgeSearchResults } from './KnowledgeSearchResults';
import type { PlatformHCArticle } from '@/types/platform-hc';

interface KnowledgeTopBarSearchProps {
  /** All articles to search through */
  articles: PlatformHCArticle[];
  /** Callback when an article is selected from search results */
  onSelect: (article: PlatformHCArticle) => void;
}

/**
 * Self-contained search component for the Admin Knowledge page.
 * Manages search state internally to avoid triggering parent re-renders.
 * Uses refs for data props to ensure stable renderResults callback.
 */
export const KnowledgeTopBarSearch = memo(function KnowledgeTopBarSearch({
  articles,
  onSelect,
}: KnowledgeTopBarSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Use refs to avoid closure issues and keep renderResults stable
  const articlesRef = useRef(articles);
  const onSelectRef = useRef(onSelect);
  
  // Keep refs updated with latest values
  useEffect(() => {
    articlesRef.current = articles;
    onSelectRef.current = onSelect;
  });
  
  // Stable renderResults with empty deps - reads from refs
  const renderResults = useCallback((query: string) => (
    <KnowledgeSearchResults
      query={query}
      articles={articlesRef.current}
      onSelect={onSelectRef.current}
    />
  ), []);

  return (
    <TopBarSearch
      placeholder="Search articles..."
      value={searchQuery}
      onChange={setSearchQuery}
      renderResults={renderResults}
    />
  );
});
