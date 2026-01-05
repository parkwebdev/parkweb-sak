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

/** Map category bg colors to ring/border colors for active states */
const ACTIVE_RING_MAP: Record<string, string> = {
  'bg-info': 'ring-info/40 bg-info/10',
  'bg-accent-purple': 'ring-accent-purple/40 bg-accent-purple/10',
  'bg-success': 'ring-success/40 bg-success/10',
  'bg-warning': 'ring-warning/40 bg-warning/10',
  'bg-status-active': 'ring-status-active/40 bg-status-active/10',
  'bg-destructive': 'ring-destructive/40 bg-destructive/10',
  'bg-muted-foreground': 'ring-muted-foreground/40 bg-muted-foreground/10',
};

const HOVER_MAP: Record<string, string> = {
  'bg-info': 'hover:bg-info/5',
  'bg-accent-purple': 'hover:bg-accent-purple/5',
  'bg-success': 'hover:bg-success/5',
  'bg-warning': 'hover:bg-warning/5',
  'bg-status-active': 'hover:bg-status-active/5',
  'bg-destructive': 'hover:bg-destructive/5',
  'bg-muted-foreground': 'hover:bg-muted-foreground/5',
};

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
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
                isCategoryView && category.id === selectedCategoryId
                  ? cn('ring-1', ACTIVE_RING_MAP[category.color] || 'ring-border bg-accent/50')
                  : cn(HOVER_MAP[category.color] || 'hover:bg-accent/30')
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
