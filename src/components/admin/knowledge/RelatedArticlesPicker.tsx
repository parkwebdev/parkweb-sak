/**
 * Related Articles Picker Component
 * 
 * Multi-select dialog for choosing related articles to link in Help Center content.
 * Allows adding and removing multiple articles with search filtering.
 * 
 * @module components/admin/knowledge/RelatedArticlesPicker
 */

import { useState, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SearchLg, XClose } from '@untitledui/icons';
import { usePlatformHelpCenter } from '@/hooks/usePlatformHelpCenter';
import { cn } from '@/lib/utils';
import type { RelatedArticle } from './RelatedArticlesNode';

interface RelatedArticlesPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedArticles: RelatedArticle[];
  onApply: (articles: RelatedArticle[]) => void;
}

/**
 * Multi-select dialog for choosing related articles
 */
export function RelatedArticlesPicker({
  open,
  onOpenChange,
  selectedArticles,
  onApply,
}: RelatedArticlesPickerProps) {
  const { categories, isLoading } = usePlatformHelpCenter();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<RelatedArticle[]>(selectedArticles);

  // Reset selected when dialog opens with new props
  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (isOpen) {
      setSelected(selectedArticles);
      setSearch('');
    }
    onOpenChange(isOpen);
  }, [selectedArticles, onOpenChange]);

  // Filter categories and articles by search
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;

    const searchLower = search.toLowerCase();
    return categories
      .map((category) => ({
        ...category,
        articles: category.articles.filter(
          (article) =>
            article.title.toLowerCase().includes(searchLower) ||
            article.description?.toLowerCase().includes(searchLower)
        ),
      }))
      .filter((category) => category.articles.length > 0);
  }, [categories, search]);

  // Check if an article is selected
  const isSelected = useCallback(
    (categoryId: string, slug: string) =>
      selected.some((a) => a.categoryId === categoryId && a.articleSlug === slug),
    [selected]
  );

  // Toggle article selection
  const toggleArticle = useCallback(
    (categoryId: string, slug: string, title: string) => {
      setSelected((prev) => {
        const exists = prev.some(
          (a) => a.categoryId === categoryId && a.articleSlug === slug
        );
        if (exists) {
          return prev.filter(
            (a) => !(a.categoryId === categoryId && a.articleSlug === slug)
          );
        }
        return [...prev, { categoryId, articleSlug: slug, title }];
      });
    },
    []
  );

  // Remove a selected article
  const removeArticle = useCallback((categoryId: string, slug: string) => {
    setSelected((prev) =>
      prev.filter((a) => !(a.categoryId === categoryId && a.articleSlug === slug))
    );
  }, []);

  // Apply selection and close
  const handleApply = useCallback(() => {
    onApply(selected);
    onOpenChange(false);
  }, [selected, onApply, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Related Articles</DialogTitle>
        </DialogHeader>

        {/* Search input */}
        <div className="relative">
          <SearchLg
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Selected articles pills */}
        {selected.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">
              Selected ({selected.length}):
            </span>
            <div className="flex flex-wrap gap-2">
              {selected.map((article) => (
                <span
                  key={`${article.categoryId}-${article.articleSlug}`}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-sm text-foreground"
                >
                  {article.title}
                  <button
                    type="button"
                    onClick={() => removeArticle(article.categoryId, article.articleSlug)}
                    className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${article.title}`}
                  >
                    <XClose size={12} aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Article list */}
        <ScrollArea className="h-64 border rounded-md">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading articles...
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {search ? 'No articles match your search' : 'No articles available'}
            </div>
          ) : (
            <div className="p-2 space-y-4">
              {filteredCategories.map((category) => (
                <div key={category.id}>
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {category.label}
                  </div>
                  <div className="space-y-1">
                    {category.articles.map((article) => {
                      const checked = isSelected(category.id, article.slug);
                      return (
                        <label
                          key={article.id}
                          className={cn(
                            'flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer',
                            'hover:bg-accent transition-colors',
                            checked && 'bg-accent/50'
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() =>
                              toggleArticle(category.id, article.slug, article.title)
                            }
                          />
                          <span className="text-sm">{article.title}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply}>
            Apply Selection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
