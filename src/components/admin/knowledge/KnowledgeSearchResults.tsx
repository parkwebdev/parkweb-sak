/**
 * @fileoverview Knowledge Search Results Component
 * 
 * Renders article search results for the TopBarSearch dropdown in Admin Knowledge page.
 * 
 * @module components/admin/knowledge/KnowledgeSearchResults
 */

import { useMemo } from 'react';
import { File06 } from '@untitledui/icons';
import { TopBarSearchResultItem, TopBarSearchEmptyState } from '@/components/layout/TopBarSearchResultItem';
import { Badge } from '@/components/ui/badge';
import type { PlatformHCArticle } from '@/types/platform-hc';

interface KnowledgeSearchResultsProps {
  /** Current search query */
  query: string;
  /** All articles to search through */
  articles: PlatformHCArticle[];
  /** Callback when an article is selected */
  onSelect: (article: PlatformHCArticle) => void;
}

/**
 * Renders article search results in the TopBarSearch dropdown.
 */
export function KnowledgeSearchResults({
  query,
  articles,
  onSelect,
}: KnowledgeSearchResultsProps) {
  // Filter articles based on query
  const results = useMemo(() => {
    if (!query.trim()) return [];
    
    const searchLower = query.toLowerCase();
    return articles
      .filter(article =>
        article.title.toLowerCase().includes(searchLower) ||
        article.description?.toLowerCase().includes(searchLower) ||
        article.slug.toLowerCase().includes(searchLower) ||
        article.category_label?.toLowerCase().includes(searchLower)
      )
      .slice(0, 8); // Limit to 8 results
  }, [query, articles]);

  if (results.length === 0) {
    return <TopBarSearchEmptyState message="No articles found" />;
  }

  return (
    <div>
      {results.map((article) => (
        <TopBarSearchResultItem
          key={article.id}
          icon={<File06 size={16} aria-hidden="true" />}
          title={article.title}
          subtitle={
            <div className="flex items-center gap-2">
              {article.category_label && (
                <Badge size="sm" variant="secondary">
                  {article.category_label}
                </Badge>
              )}
              {!article.is_published && (
                <Badge size="sm" variant="outline" className="text-muted-foreground">
                  Draft
                </Badge>
              )}
            </div>
          }
          onClick={() => onSelect(article)}
        />
      ))}
    </div>
  );
}
