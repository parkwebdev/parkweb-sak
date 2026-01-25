/**
 * Help Center Category View
 * 
 * Category landing page with search and article cards grid.
 * Now uses DB-driven types from usePlatformHelpCenter.
 * 
 * @module components/help-center/HCCategoryView
 */

import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { SearchMd, XClose } from '@untitledui/icons';
import { Input } from '@/components/ui/input';
import { HCArticleCard } from './HCArticleCard';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springs } from '@/lib/motion-variants';
import { cn } from '@/lib/utils';
import { getCategoryColor, getGradientClass } from '@/lib/hc-category-colors';
import type { PlatformHCCategory, PlatformHCArticle } from '@/hooks/usePlatformHelpCenter';

interface HCCategoryViewProps {
  category: PlatformHCCategory;
  onSelectArticle: (article: PlatformHCArticle) => void;
}

export function HCCategoryView({ category, onSelectArticle }: HCCategoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const prefersReducedMotion = useReducedMotion();
  
  // Get color class for this category
  const colorClass = getCategoryColor(category.id, category.color);
  const gradientClasses = getGradientClass(colorClass);
  
  // Filter articles based on search
  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return category.articles;
    
    const query = searchQuery.toLowerCase();
    return category.articles.filter(
      (article) =>
        article.title.toLowerCase().includes(query) ||
        article.description?.toLowerCase().includes(query)
    );
  }, [category.articles, searchQuery]);

  return (
    <div className="px-8">
      {/* Header with gradient background */}
      <header className={cn('bg-gradient-to-b py-8 -mx-8 px-8 mt-0', gradientClasses)}>
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          {category.label}
        </h1>
        <p className="text-muted-foreground text-base">
          {category.articles.length} article{category.articles.length !== 1 ? 's' : ''} in this category
        </p>
      </header>
      
      {/* Search */}
      <div className="py-6">
        <div className="relative max-w-md">
          <SearchMd 
            size={16} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
            aria-hidden="true"
          />
          <Input
            type="text"
            placeholder={`Search in ${category.label}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8"
            size="sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Clear search"
            >
              <XClose size={14} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      
      {/* Article Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-8">
        {filteredArticles.map((article, index) => (
          <motion.div
            key={article.id}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, ...springs.smooth }}
          >
            <HCArticleCard
              article={article}
              categoryColor={colorClass}
              onClick={() => onSelectArticle(article)}
            />
          </motion.div>
        ))}
      </div>
      
      {/* Empty state */}
      {filteredArticles.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No articles found for "{searchQuery}"
        </div>
      )}
    </div>
  );
}
