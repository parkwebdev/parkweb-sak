/**
 * Help Center Sidebar
 * 
 * Left navigation sidebar with categorized article list.
 * Categories are collapsible using the standard Accordion component.
 * Now uses DB-driven types from usePlatformHelpCenter.
 * 
 * @module components/help-center/HCSidebar
 */

import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  Accordion, 
  AccordionItem, 
  AccordionTrigger, 
  AccordionContent 
} from '@/components/ui/accordion';
import { 
  getCategoryColor, 
  getActiveRing, 
  getHoverClass 
} from '@/lib/hc-category-colors';
import type { PlatformHCCategory, PlatformHCArticle } from '@/hooks/usePlatformHelpCenter';

interface HCSidebarProps {
  categories: PlatformHCCategory[];
  selectedCategoryId?: string;
  selectedArticleSlug?: string;
  /** True when viewing a category landing page (no article selected) */
  isCategoryView?: boolean;
  onSelectCategory: (category: PlatformHCCategory) => void;
  onSelectArticle: (category: PlatformHCCategory, article: PlatformHCArticle) => void;
  /** Search query from TopBar */
  searchQuery?: string;
}

export function HCSidebar({
  categories,
  selectedCategoryId,
  selectedArticleSlug,
  isCategoryView,
  onSelectCategory,
  onSelectArticle,
  searchQuery = '',
}: HCSidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  // Auto-expand the selected category (only when selection changes)
  useEffect(() => {
    if (selectedCategoryId) {
      setExpandedCategories(prev => 
        prev.includes(selectedCategoryId) ? prev : [...prev, selectedCategoryId]
      );
    }
  }, [selectedCategoryId]);
  
  // Filter articles based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    
    const query = searchQuery.toLowerCase();
    return categories
      .map(category => ({
        ...category,
        articles: category.articles.filter(
          (article) =>
            article.title.toLowerCase().includes(query) ||
            article.description?.toLowerCase().includes(query)
        ),
      }))
      .filter(category => category.articles.length > 0);
  }, [categories, searchQuery]);
  
  // When searching, expand all matching categories
  useEffect(() => {
    if (searchQuery.trim()) {
      const matchingIds = filteredCategories.map(c => c.id);
      setExpandedCategories(matchingIds);
    }
  }, [searchQuery, filteredCategories]);

  return (
    <aside className="w-[260px] border-r border-border flex flex-col h-full bg-background print:hidden">
      <nav className="flex-1 overflow-y-auto p-3" aria-label="Help Center navigation">
        <Accordion 
          type="multiple" 
          value={expandedCategories}
          onValueChange={setExpandedCategories}
          className="space-y-1 bg-transparent border-none shadow-none p-0 rounded-none"
        >
          {filteredCategories.map((category) => {
            // Show active state for category page OR any article within the category
            const isCategorySelected = category.id === selectedCategoryId;
            const isCategoryPageActive = isCategoryView && isCategorySelected;
            const colorClass = getCategoryColor(category.id, category.color);
            const activeRingClass = getActiveRing(colorClass);
            const hoverClass = getHoverClass(colorClass);
            
            return (
              <AccordionItem 
                key={category.id} 
                value={category.id}
                className="border-none"
              >
                <AccordionTrigger 
                  showIcon={true}
                  onClick={() => {
                    // Only navigate if clicking a different category
                    // If already on this category, just let accordion toggle
                    if (category.id !== selectedCategoryId) {
                      onSelectCategory(category);
                    }
                  }}
                  className={cn(
                    'w-full flex items-center justify-between gap-1 px-2.5 py-1.5 rounded-md transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
                    '[&>svg]:size-3.5 [&>svg]:text-muted-foreground/50',
                    'hover:no-underline',
                    // Show ring when viewing category page OR any article in this category
                    isCategorySelected
                      ? cn('ring-1', activeRingClass)
                      : hoverClass
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span 
                      className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', colorClass)} 
                      aria-hidden="true"
                    />
                    <span className={cn(
                      'text-2xs font-semibold uppercase tracking-wider',
                      isCategorySelected
                        ? 'text-foreground'
                        : 'text-muted-foreground/60 group-hover:text-muted-foreground'
                    )}>
                      {category.label}
                    </span>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="ml-5 mt-1.5 space-y-0.5 pb-1">
                  {category.articles.map((article) => {
                    const isSelected = 
                      category.id === selectedCategoryId && article.slug === selectedArticleSlug;
                    
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
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
        
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
