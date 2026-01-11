/**
 * @fileoverview Knowledge Base Search Results Component
 * 
 * Renders KB article search results for the TopBarSearch dropdown.
 * 
 * @module components/knowledge-base/KBSearchResults
 */

import React, { useMemo } from 'react';
import { BookOpen01 } from '@untitledui/icons';
import { TopBarSearchResultItem, TopBarSearchEmptyState } from '@/components/layout/TopBarSearchResultItem';
import { KB_CATEGORIES, type KBCategory, type KBArticle } from '@/config/knowledge-base-config';

interface SearchResult {
  category: KBCategory;
  article: KBArticle;
}

interface KBSearchResultsProps {
  /** Current search query */
  query: string;
  /** Callback when an article is selected */
  onSelect: (category: KBCategory, article: KBArticle) => void;
  /** Maximum number of results to show (default: 8) */
  maxResults?: number;
}

/**
 * Renders KB article search results in the TopBarSearch dropdown.
 */
export function KBSearchResults({
  query,
  onSelect,
  maxResults = 8,
}: KBSearchResultsProps) {
  // Search across all articles
  const results = useMemo(() => {
    if (!query.trim()) return [];
    
    const searchTerm = query.toLowerCase();
    const matches: SearchResult[] = [];
    
    for (const category of KB_CATEGORIES) {
      for (const article of category.articles) {
        const titleMatch = article.title.toLowerCase().includes(searchTerm);
        const descMatch = article.description?.toLowerCase().includes(searchTerm);
        
        if (titleMatch || descMatch) {
          matches.push({ category, article });
        }
      }
    }
    
    return matches.slice(0, maxResults);
  }, [query, maxResults]);

  if (results.length === 0) {
    return <TopBarSearchEmptyState message="No articles found" />;
  }

  return (
    <>
      {results.map(({ category, article }) => (
        <TopBarSearchResultItem
          key={`${category.id}-${article.id}`}
          icon={<BookOpen01 size={16} />}
          title={article.title}
          subtitle={category.label}
          onClick={() => onSelect(category, article)}
        />
      ))}
    </>
  );
}
