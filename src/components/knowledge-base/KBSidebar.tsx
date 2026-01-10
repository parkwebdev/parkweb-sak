/**
 * Knowledge Base Sidebar
 * 
 * Left navigation sidebar with search and categorized article list.
 * Categories are collapsible accordion-style for better navigation.
 * 
 * @module components/knowledge-base/KBSidebar
 */

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from '@untitledui/icons';
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
  /** Search query from TopBar */
  searchQuery?: string;
}

export function KBSidebar({
  categories,
  selectedCategoryId,
  selectedArticleId,
  isCategoryView,
  onSelectCategory,
  onSelectArticle,
  searchQuery = '',
}: KBSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const prefersReducedMotion = useReducedMotion();
  
  // Auto-expand the selected category
  useEffect(() => {
    if (selectedCategoryId) {
      setExpandedCategories(prev => {
        const next = new Set(prev);
        next.add(selectedCategoryId);
        return next;
      });
    }
  }, [selectedCategoryId]);
  
  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };
  
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
  
  // When searching, expand all matching categories
  useEffect(() => {
    if (searchQuery.trim()) {
      const matchingIds = new Set(filteredCategories.map(c => c.id));
      setExpandedCategories(matchingIds);
    }
  }, [searchQuery, filteredCategories]);

  return (
    <aside className="w-[260px] border-r border-border flex flex-col h-full bg-background">
      {/* Categories and Articles */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1" aria-label="Knowledge Base navigation">
        {filteredCategories.map((category, categoryIndex) => {
          const isExpanded = expandedCategories.has(category.id);
          const isCategoryActive = isCategoryView && category.id === selectedCategoryId;
          
          return (
            <motion.div
              key={category.id}
              initial={prefersReducedMotion ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: categoryIndex * 0.05, ...springs.smooth }}
            >
              {/* Category Header */}
              <div className="flex items-center gap-1">
                {/* Expand/Collapse Toggle */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className={cn(
                    'p-1 rounded transition-colors',
                    'hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                  )}
                  aria-expanded={isExpanded}
                  aria-label={isExpanded ? `Collapse ${category.label}` : `Expand ${category.label}`}
                >
                  <ChevronDown 
                    size={14} 
                    className={cn(
                      'text-muted-foreground/50 transition-transform duration-200',
                      isExpanded ? 'rotate-0' : '-rotate-90'
                    )}
                    aria-hidden="true"
                  />
                </button>
                
                {/* Category Label - Navigates to category page */}
                <button
                  onClick={() => onSelectCategory(category)}
                  className={cn(
                    'flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors text-left',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
                    isCategoryActive
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
                    isCategoryActive
                      ? 'text-foreground'
                      : 'text-muted-foreground/60 hover:text-muted-foreground'
                  )}>
                    {category.label}
                  </span>
                </button>
              </div>
              
              {/* Articles - Collapsible */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="space-y-0.5 mt-0.5 ml-5">
                      {category.articles.map((article) => {
                        const isSelected = 
                          category.id === selectedCategoryId && article.id === selectedArticleId;
                        
                        return (
                          <button
                            key={article.id}
                            onClick={() => onSelectArticle(category, article)}
                            className={cn(
                              'w-full text-left px-2.5 py-1.5 rounded-md text-sm transition-colors',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                              isSelected
                                ? 'bg-accent text-accent-foreground font-medium'
                                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                            )}
                            aria-current={isSelected ? 'page' : undefined}
                          >
                            {article.title}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
        
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
