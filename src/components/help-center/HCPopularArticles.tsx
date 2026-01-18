/**
 * Help Center Popular Articles
 * 
 * Displays the most popular articles in a category based on view counts.
 * Used in the right sidebar when viewing category landing pages.
 * 
 * @module components/help-center/HCPopularArticles
 */


import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { usePopularArticles } from '@/hooks/useHCArticleViews';
import type { HCArticle } from '@/config/help-center-config';

interface HCPopularArticlesProps {
  categoryId: string;
  onSelectArticle: (article: HCArticle) => void;
}

export function HCPopularArticles({ categoryId, onSelectArticle }: HCPopularArticlesProps) {
  const { data: popularArticles, isLoading } = usePopularArticles(categoryId, 10);
  
  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-3 w-24" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }
  
  // Show empty state if no views yet
  if (!popularArticles?.length) {
    return (
      <div className="p-4">
        <h3 className="text-2xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Popular Articles
        </h3>
        <p className="text-xs text-muted-foreground/60">
          No article views yet.
        </p>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <h3 className="text-2xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
        Popular Articles
      </h3>
      
      <nav className="space-y-1" aria-label="Popular articles">
        {popularArticles.map(({ article }: { article: HCArticle }, index: number) => (
          <button
            key={article.id}
            onClick={() => onSelectArticle(article)}
            className={cn(
              'w-full text-left px-2 py-2 rounded-md',
              'flex items-start gap-2',
              'text-xs text-muted-foreground hover:text-foreground',
              'hover:bg-accent transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
          >
            <span className="text-2xs text-muted-foreground/50 font-medium mt-0.5 w-3">
              {index + 1}.
            </span>
            <span className="flex-1 line-clamp-2">{article.title}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
