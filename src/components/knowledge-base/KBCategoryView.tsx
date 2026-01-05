/**
 * Knowledge Base Category View
 * 
 * Category landing page with search and article cards grid.
 * 
 * @module components/knowledge-base/KBCategoryView
 */

import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { SearchMd } from '@untitledui/icons';
import { Input } from '@/components/ui/input';
import { KBArticleCard } from './KBArticleCard';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springs } from '@/lib/motion-variants';
import { cn } from '@/lib/utils';
import type { KBCategory, KBArticle } from '@/config/knowledge-base-config';

/** Map category color classes to gradient backgrounds */
const GRADIENT_MAP: Record<string, string> = {
  'bg-info': 'from-info/15 via-info/5 to-transparent',
  'bg-accent-purple': 'from-accent-purple/15 via-accent-purple/5 to-transparent',
  'bg-success': 'from-success/15 via-success/5 to-transparent',
  'bg-warning': 'from-warning/15 via-warning/5 to-transparent',
  'bg-status-active': 'from-status-active/15 via-status-active/5 to-transparent',
  'bg-destructive': 'from-destructive/15 via-destructive/5 to-transparent',
  'bg-muted-foreground': 'from-muted-foreground/15 via-muted-foreground/5 to-transparent',
};

interface KBCategoryViewProps {
  category: KBCategory;
  onSelectArticle: (article: KBArticle) => void;
}

export function KBCategoryView({ category, onSelectArticle }: KBCategoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const prefersReducedMotion = useReducedMotion();
  
  // Get gradient class for header
  const gradientClasses = GRADIENT_MAP[category.color] || 'from-muted/15 via-muted/5 to-transparent';
  
  // Filter articles based on search
  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return category.articles;
    
    const query = searchQuery.toLowerCase();
    return category.articles.filter(
      article =>
        article.title.toLowerCase().includes(query) ||
        article.description?.toLowerCase().includes(query)
    );
  }, [category.articles, searchQuery]);

  return (
    <div className="px-8">
      {/* Header with gradient background */}
      <header className={cn('bg-gradient-to-b py-8 -mx-8 px-8', gradientClasses)}>
        {/* Breadcrumb */}
        <nav className="mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <li>Knowledge Base</li>
            <li aria-hidden="true">/</li>
            <li className="text-foreground font-medium">{category.label}</li>
          </ol>
        </nav>
        
        {/* Category Title */}
        <div className="flex items-center gap-3 mb-2">
          <span 
            className={cn('w-2.5 h-2.5 rounded-full', category.color)} 
            aria-hidden="true" 
          />
          <h1 className="text-base font-semibold text-foreground">
            {category.label}
          </h1>
        </div>
        
        {/* Article count */}
        <p className="text-sm text-muted-foreground pl-5">
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
            type="search"
            placeholder={`Search in ${category.label}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            size="sm"
          />
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
            <KBArticleCard
              article={article}
              categoryColor={category.color}
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
