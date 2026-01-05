/**
 * Knowledge Base Sidebar
 * 
 * Left navigation sidebar with search and categorized article list.
 * 
 * @module components/knowledge-base/KBSidebar
 */

import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { SearchMd } from '@untitledui/icons';
import { Input } from '@/components/ui/input';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springs } from '@/lib/motion-variants';
import { cn } from '@/lib/utils';
import type { KBCategory, KBArticle } from '@/config/knowledge-base-config';

interface KBSidebarProps {
  categories: KBCategory[];
  selectedCategoryId?: string;
  selectedArticleId?: string;
  /** True when viewing a category landing page (no article selected) */
  isCategoryView?: boolean;
  onSelectCategory: (category: KBCategory) => void;
  onSelectArticle: (category: KBCategory, article: KBArticle) => void;
}

export function KBSidebar({
  categories,
  selectedCategoryId,
  selectedArticleId,
  isCategoryView,
  onSelectCategory,
  onSelectArticle,
}: KBSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const prefersReducedMotion = useReducedMotion();
  
  // Filter articles based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    
    const query = searchQuery.toLowerCase();
    return categories
      .map(category => ({
        ...category,
        articles: category.articles.filter(
          article =>
            article.title.toLowerCase().includes(query) ||
            article.description?.toLowerCase().includes(query)
        ),
      }))
      .filter(category => category.articles.length > 0);
  }, [categories, searchQuery]);

  return (
    <aside className="w-[260px] border-r border-border flex flex-col h-full bg-background">
      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <SearchMd 
            size={16} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            size="sm"
          />
        </div>
      </div>
      
      {/* Categories and Articles */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4" aria-label="Knowledge Base navigation">
        {filteredCategories.map((category, categoryIndex) => (
          <motion.div
            key={category.id}
            initial={prefersReducedMotion ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: categoryIndex * 0.05, ...springs.smooth }}
          >
            {/* Category Header - Clickable */}
            <button
              onClick={() => onSelectCategory(category)}
              className={cn(
                'w-full flex items-center gap-2 px-2.5 py-1.5 mb-1 rounded-md transition-colors',
                'hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
                isCategoryView && category.id === selectedCategoryId && 'bg-accent/50'
              )}
            >
              <span 
                className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', category.color)} 
                aria-hidden="true"
              />
              <span className={cn(
                'text-2xs font-semibold uppercase tracking-wider',
                isCategoryView && category.id === selectedCategoryId
                  ? 'text-foreground'
                  : 'text-muted-foreground/60 hover:text-muted-foreground'
              )}>
                {category.label}
              </span>
            </button>
            
            {/* Articles */}
            <div className="space-y-0.5">
              {category.articles.map((article, articleIndex) => {
                const isSelected = 
                  category.id === selectedCategoryId && article.id === selectedArticleId;
                
                return (
                  <motion.button
                    key={article.id}
                    onClick={() => onSelectArticle(category, article)}
                    className={cn(
                      'w-full text-left px-2.5 py-2 rounded-md text-sm transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                      isSelected
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                    )}
                    aria-current={isSelected ? 'page' : undefined}
                    initial={prefersReducedMotion ? false : { opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (categoryIndex * 0.05) + (articleIndex * 0.02), ...springs.smooth }}
                  >
                    {article.title}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        ))}
        
        {/* Empty state */}
        {filteredCategories.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No articles found for "{searchQuery}"
          </div>
        )}
      </nav>
    </aside>
  );
}
