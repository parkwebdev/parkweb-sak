/**
 * @fileoverview Help Center TopBar Search Component
 * 
 * Encapsulates search state and results rendering for the Help Center page.
 * Manages its own search query state to prevent parent re-renders.
 * 
 * @module components/help-center/HCTopBarSearch
 */

import { useState, useCallback, memo } from 'react';
import { TopBarSearch } from '@/components/layout/TopBar';
import { HCSearchResults } from './HCSearchResults';
import type { HCCategory, HCArticle } from '@/config/help-center-config';

interface HCTopBarSearchProps {
  /** Callback when an article is selected from search results */
  onSelect: (category: HCCategory, article: HCArticle) => void;
}

/**
 * Self-contained search component for the Knowledge Base page.
 * Manages search state internally to avoid triggering parent re-renders.
 */
export const HCTopBarSearch = memo(function HCTopBarSearch({
  onSelect,
}: HCTopBarSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const renderResults = useCallback((query: string) => (
    <HCSearchResults
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
