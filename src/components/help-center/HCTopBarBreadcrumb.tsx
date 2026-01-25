/**
 * Help Center TopBar Breadcrumb
 * 
 * Displays category and article navigation in the TopBar.
 * Shows clickable category with color dot and current article title.
 * 
 * @module components/help-center/HCTopBarBreadcrumb
 */

import { cn } from '@/lib/utils';
import { getCategoryColor } from '@/lib/hc-category-colors';
import type { PlatformHCCategory, PlatformHCArticle } from '@/hooks/usePlatformHelpCenter';

interface HCTopBarBreadcrumbProps {
  category: PlatformHCCategory;
  article?: PlatformHCArticle;
  onCategoryClick: () => void;
}

export function HCTopBarBreadcrumb({ category, article, onCategoryClick }: HCTopBarBreadcrumbProps) {
  const colorClass = getCategoryColor(category.id, category.color);
  
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
      <span className={cn('w-2 h-2 rounded-full shrink-0', colorClass)} aria-hidden="true" />
      <button
        onClick={onCategoryClick}
        className="hover:text-foreground hover:underline transition-colors truncate"
      >
        {category.label}
      </button>
      {article && (
        <>
          <span className="shrink-0" aria-hidden="true">/</span>
          <span className="text-foreground font-medium truncate">{article.title}</span>
        </>
      )}
    </div>
  );
}
