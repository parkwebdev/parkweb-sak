/**
 * Help Center Article Link Component
 * 
 * Renders a styled link to another HC article for cross-referencing.
 * 
 * @module components/help-center/HCArticleLink
 */

import { Link } from 'react-router-dom';
import { ArrowRight } from '@untitledui/icons';
import { cn } from '@/lib/utils';

interface HCArticleLinkProps {
  /** Category ID for the linked article */
  categoryId: string;
  /** Article slug for the linked article */
  articleSlug: string;
  /** Display text for the link */
  children: React.ReactNode;
  /** Optional additional className */
  className?: string;
}

export function HCArticleLink({ categoryId, articleSlug, children, className }: HCArticleLinkProps) {
  return (
    <Link
      to={`/help-center?category=${categoryId}&article=${articleSlug}`}
      className={cn(
        'inline-flex items-center gap-1 text-primary hover:text-primary/80 font-medium transition-colors',
        className
      )}
    >
      {children}
      <ArrowRight size={14} aria-hidden="true" />
    </Link>
  );
}

interface HCRelatedArticlesProps {
  /** Array of related articles */
  articles: Array<{
    categoryId: string;
    articleSlug: string;
    title: string;
  }>;
  /** Optional additional className */
  className?: string;
}

export function HCRelatedArticles({ articles, className }: HCRelatedArticlesProps) {
  if (articles.length === 0) return null;

  return (
    <div className={cn('mt-8 pt-6 border-t border-border', className)}>
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Related Articles</h3>
      <div className="flex flex-wrap gap-3">
        {articles.map((article) => (
          <Link
            key={`${article.categoryId}-${article.articleSlug}`}
            to={`/help-center?category=${article.categoryId}&article=${article.articleSlug}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted text-sm text-foreground hover:bg-muted/80 transition-colors"
          >
            {article.title}
            <ArrowRight size={12} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </div>
  );
}
