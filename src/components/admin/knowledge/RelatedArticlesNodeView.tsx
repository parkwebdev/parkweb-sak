/**
 * Related Articles React NodeView
 * 
 * Interactive TipTap NodeView component for managing related article links.
 * Allows clicking to add/edit articles and removing individual articles.
 * 
 * @module components/admin/knowledge/RelatedArticlesNodeView
 */

import { useState, useCallback } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { XClose, Plus } from '@untitledui/icons';
import { RelatedArticlesPicker } from './RelatedArticlesPicker';
import type { RelatedArticle } from './RelatedArticlesNode';
import { cn } from '@/lib/utils';

/**
 * React NodeView for Related Articles block
 */
export function RelatedArticlesNodeView({ node, updateAttributes }: NodeViewProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const articles = (node.attrs.articles || []) as RelatedArticle[];

  // Open picker to manage articles
  const handleOpenPicker = useCallback(() => {
    setIsPickerOpen(true);
  }, []);

  // Apply selected articles from picker
  const handleApplyArticles = useCallback(
    (newArticles: RelatedArticle[]) => {
      updateAttributes({ articles: newArticles });
    },
    [updateAttributes]
  );

  // Remove a single article
  const handleRemoveArticle = useCallback(
    (categoryId: string, articleSlug: string) => {
      const updated = articles.filter(
        (a) => !(a.categoryId === categoryId && a.articleSlug === articleSlug)
      );
      updateAttributes({ articles: updated });
    },
    [articles, updateAttributes]
  );

  return (
    <NodeViewWrapper
      className="related-articles-editor mt-8 pt-6 border-t border-border"
      data-related-articles=""
    >
      {/* Heading - only shown in editor (CSS ::before handles read-only views) */}
      <span className="text-sm font-medium text-muted-foreground block mb-3">
        Related Articles
      </span>

      {/* Article pills container */}
      <div className="flex flex-wrap gap-2">
        {articles.length === 0 ? (
          // Empty state - clickable to add
          <button
            type="button"
            onClick={handleOpenPicker}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md',
              'border border-dashed border-border',
              'text-sm text-muted-foreground italic',
              'hover:border-primary hover:text-foreground',
              'transition-colors cursor-pointer'
            )}
          >
            <Plus size={14} aria-hidden="true" />
            Add related articles...
          </button>
        ) : (
          <>
            {/* Render each article as an interactive pill */}
            {articles.map((article) => (
              <span
                key={`${article.categoryId}-${article.articleSlug}`}
                className={cn(
                  'group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md',
                  'bg-muted text-sm text-foreground'
                )}
              >
                {article.title}
                <button
                  type="button"
                  onClick={() =>
                    handleRemoveArticle(article.categoryId, article.articleSlug)
                  }
                  className={cn(
                    'ml-1 rounded-full p-0.5',
                    'opacity-0 group-hover:opacity-100',
                    'hover:bg-destructive/20 text-muted-foreground hover:text-destructive',
                    'transition-opacity'
                  )}
                  aria-label={`Remove ${article.title}`}
                >
                  <XClose size={12} aria-hidden="true" />
                </button>
              </span>
            ))}

            {/* Add more button */}
            <button
              type="button"
              onClick={handleOpenPicker}
              className={cn(
                'inline-flex items-center justify-center',
                'w-8 h-8 rounded-md',
                'border border-dashed border-border',
                'text-muted-foreground hover:text-foreground hover:border-primary',
                'transition-colors'
              )}
              aria-label="Add more related articles"
            >
              <Plus size={16} aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {/* Picker dialog - rendered outside the content */}
      <RelatedArticlesPicker
        open={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        selectedArticles={articles}
        onApply={handleApplyArticles}
      />
    </NodeViewWrapper>
  );
}
