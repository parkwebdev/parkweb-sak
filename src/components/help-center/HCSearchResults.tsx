/**
 * @fileoverview Help Center Search Results Component
 * 
 * Renders HC article search results for the TopBarSearch dropdown.
 * 
 * @module components/help-center/HCSearchResults
 */

import { useMemo } from 'react';
import { BookOpen01 } from '@untitledui/icons';
import { TopBarSearchResultItem, TopBarSearchEmptyState } from '@/components/layout/TopBarSearchResultItem';
import { Badge } from '@/components/ui/badge';
import { HC_CATEGORIES, type HCCategory, type HCArticle } from '@/config/help-center-config';

interface SearchResult {
  category: HCCategory;
  article: HCArticle;
}

interface HCSearchResultsProps {
  /** Current search query */
  query: string;
  /** Callback when an article is selected */
  onSelect: (category: HCCategory, article: HCArticle) => void;
  /** Maximum number of results to show (default: 8) */
  maxResults?: number;
}

/**
 * Renders KB article search results in the TopBarSearch dropdown.
 */
export function HCSearchResults({
  query,
  onSelect,
  maxResults = 8,
}: HCSearchResultsProps) {
  // Search across all articles
  const results = useMemo(() => {
    if (!query.trim()) return [];
    
    const searchTerm = query.toLowerCase();
    const matches: SearchResult[] = [];
    
    for (const category of HC_CATEGORIES) {
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
          subtitle={<Badge variant="secondary" size="sm">{category.label}</Badge>}
          onClick={() => onSelect(category, article)}
        />
      ))}
    </>
  );
}
