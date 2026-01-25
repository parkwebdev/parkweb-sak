/**
 * @fileoverview Help Center Search Results Component
 * 
 * Renders HC article search results for the TopBarSearch dropdown.
 * Now uses DB-driven data from usePlatformHelpCenter.
 * 
 * @module components/help-center/HCSearchResults
 */

import { useMemo } from 'react';
import { motion } from 'motion/react';
import { TopBarSearchResultItem, TopBarSearchEmptyState } from '@/components/layout/TopBarSearchResultItem';
import { Badge } from '@/components/ui/badge';
import { usePlatformHelpCenter, type PlatformHCCategory, type PlatformHCArticle } from '@/hooks/usePlatformHelpCenter';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springs } from '@/lib/motion-variants';
import { getCategoryColor, getCategoryBadgeClasses } from '@/lib/hc-category-colors';

interface SearchResult {
  category: PlatformHCCategory;
  article: PlatformHCArticle;
}

interface HCSearchResultsProps {
  /** Current search query */
  query: string;
  /** Callback when an article is selected */
  onSelect: (category: PlatformHCCategory, article: PlatformHCArticle) => void;
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
  const { categories, isLoading } = usePlatformHelpCenter();
  const prefersReducedMotion = useReducedMotion();
  
  // Search across all articles
  const results = useMemo(() => {
    if (!query.trim() || isLoading) return [];
    
    const searchTerm = query.toLowerCase();
    const matches: SearchResult[] = [];
    
    for (const category of categories) {
      for (const article of category.articles) {
        const titleMatch = article.title.toLowerCase().includes(searchTerm);
        const descMatch = article.description?.toLowerCase().includes(searchTerm);
        
        if (titleMatch || descMatch) {
          matches.push({ category, article });
        }
      }
    }
    
    return matches.slice(0, maxResults);
  }, [query, maxResults, categories, isLoading]);

  if (isLoading) {
    return <TopBarSearchEmptyState message="Loading..." />;
  }

  if (results.length === 0) {
    return <TopBarSearchEmptyState message="No articles found" />;
  }

  return (
    <>
      {results.map(({ category, article }, index) => {
        const colorClass = getCategoryColor(category.id, category.color);
        return (
          <motion.div
            key={`${category.id}-${article.id}`}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, ...springs.smooth }}
          >
            <TopBarSearchResultItem
              title={article.title}
              statusIndicator={
                <Badge 
                  variant="secondary" 
                  size="sm"
                  className={getCategoryBadgeClasses(colorClass)}
                >
                  {category.label}
                </Badge>
              }
              onClick={() => onSelect(category, article)}
            />
          </motion.div>
        );
      })}
    </>
  );
}
