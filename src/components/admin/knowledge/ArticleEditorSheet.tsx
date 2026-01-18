/**
 * ArticleEditorSheet Component
 * 
 * Full-featured editor sheet for platform KB articles.
 * Uses TipTap rich text editor for content.
 * 
 * @module components/admin/knowledge/ArticleEditorSheet
 */

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { PlatformHCArticle, PlatformHCArticleInput, PlatformHCCategory } from '@/types/platform-hc';

interface ArticleEditorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: PlatformHCArticle | null;
  categories: PlatformHCCategory[];
  onSave: (data: PlatformHCArticleInput) => Promise<void>;
  isSaving?: boolean;
}

/**
 * Generate a URL-friendly slug from a title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function ArticleEditorSheet({
  open,
  onOpenChange,
  article,
  categories,
  onSave,
  isSaving = false,
}: ArticleEditorSheetProps) {
  const isEditing = !!article;
  
  const [formData, setFormData] = useState<PlatformHCArticleInput>({
    category_id: '',
    slug: '',
    title: '',
    description: '',
    content: '',
    icon_name: null,
    order_index: 0,
    is_published: true,
  });

  // Reset form when article changes
  useEffect(() => {
    if (article) {
      setFormData({
        category_id: article.category_id,
        slug: article.slug,
        title: article.title,
        description: article.description || '',
        content: article.content,
        icon_name: article.icon_name,
        order_index: article.order_index,
        is_published: article.is_published,
      });
    } else {
      setFormData({
        category_id: categories[0]?.id || '',
        slug: '',
        title: '',
        description: '',
        content: '',
        icon_name: null,
        order_index: 0,
        is_published: true,
      });
    }
  }, [article, categories]);

  // Auto-generate slug from title when creating new article
  const handleTitleChange = (title: string): void => {
    setFormData((prev) => ({
      ...prev,
      title,
      // Only auto-generate slug if creating new article
      slug: !isEditing ? generateSlug(title) : prev.slug,
    }));
  };

  const handleSave = async () => {
    await onSave(formData);
    onOpenChange(false);
  };

  const isValid = formData.title.trim() && formData.slug.trim() && formData.category_id;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <SheetTitle>{isEditing ? 'Edit Article' : 'New Article'}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Update the article content and settings'
              : 'Create a new knowledge base article'}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="article-title">Title</Label>
              <Input
                id="article-title"
                placeholder="Enter article title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="article-slug">Slug</Label>
              <Input
                id="article-slug"
                placeholder="url-friendly-slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                URL path: /knowledge-base/{formData.category_id}/{formData.slug || 'slug'}
              </p>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="article-category">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger id="article-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="article-description">Description</Label>
              <Textarea
                id="article-description"
                placeholder="Brief description for previews"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            {/* Order Index */}
            <div className="space-y-2">
              <Label htmlFor="article-order">Order Index</Label>
              <Input
                id="article-order"
                type="number"
                min={0}
                value={formData.order_index}
                onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first within the category
              </p>
            </div>

            {/* Published Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="article-published">Published</Label>
                <p className="text-xs text-muted-foreground">
                  Make this article visible to all users
                </p>
              </div>
              <Switch
                id="article-published"
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
              />
            </div>

            {/* Content Editor */}
            <div className="space-y-2">
              <Label>Content</Label>
              <RichTextEditor
                content={formData.content}
                onChange={(html) => setFormData({ ...formData, content: html })}
                placeholder="Write your article content..."
                minHeight="400px"
              />
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="p-6 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid || isSaving}>
            {isSaving ? 'Saving...' : isEditing ? 'Update Article' : 'Create Article'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
