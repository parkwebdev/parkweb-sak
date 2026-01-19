/**
 * Article Link Picker Dialog
 * 
 * Allows users to search and select articles to link to.
 * Used by the EditorFloatingToolbar for creating article links.
 * 
 * @module components/admin/knowledge/ArticleLinkPicker
 */

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SearchLg } from '@untitledui/icons';
import { usePlatformHelpCenter } from '@/hooks/usePlatformHelpCenter';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ArticleLinkPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (categoryId: string, articleSlug: string) => void;
}

/**
 * Dialog for picking an article to link to.
 * Shows categories with their articles in a searchable list.
 */
export function ArticleLinkPicker({ open, onOpenChange, onSelect }: ArticleLinkPickerProps) {
  const [search, setSearch] = useState('');
  const { categories, isLoading } = usePlatformHelpCenter();

  // Filter articles based on search
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    
    const searchLower = search.toLowerCase();
    return categories
      .map(category => ({
        ...category,
        articles: category.articles.filter(
          article => 
            article.title.toLowerCase().includes(searchLower) ||
            article.description?.toLowerCase().includes(searchLower)
        ),
      }))
      .filter(category => category.articles.length > 0);
  }, [categories, search]);

  const handleSelect = (categoryId: string, articleSlug: string) => {
    onSelect(categoryId, articleSlug);
    onOpenChange(false);
    setSearch('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Link to Article</DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          <SearchLg size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles..."
            className="pl-9"
            autoFocus
          />
        </div>

        <ScrollArea className="max-h-[300px]">
          {isLoading ? (
            <div className="space-y-4 p-2">
              <Skeleton className="h-4 w-24" />
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {search ? 'No articles found' : 'No articles available'}
            </div>
          ) : (
            <div className="space-y-4 p-1">
              {filteredCategories.map(category => (
                <div key={category.id}>
                  <h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {category.label}
                  </h4>
                  <div className="space-y-1">
                    {category.articles.map(article => (
                      <button
                        key={article.id}
                        onClick={() => handleSelect(category.id, article.slug)}
                        className={cn(
                          'w-full rounded-md px-3 py-2 text-left transition-colors',
                          'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                        )}
                      >
                        <div className="text-sm font-medium">{article.title}</div>
                        {article.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {article.description}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
