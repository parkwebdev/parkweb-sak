/**
 * ArticleDetailsSheet Component
 * 
 * Sheet for viewing and editing help article details.
 * Follows the KnowledgeDetailsSheet pattern with deferred content mounting.
 * 
 * @module components/agents/articles/ArticleDetailsSheet
 */

import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  File06, Trash01, CheckCircle, Clock, Image01, XClose, RefreshCcw01, Calendar
} from '@untitledui/icons';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from '@/lib/toast';
import { uploadFeaturedImage } from '@/lib/article-image-upload';
import { CATEGORY_ICON_OPTIONS, CategoryIcon, type CategoryIconName } from '@/widget/category-icons';
import type { HelpArticleWithMeta } from '@/components/data-table/columns/help-articles-columns';
import type { Tables } from '@/integrations/supabase/types';

type HelpCategory = Tables<'help_categories'>;

interface ArticleDetailsSheetProps {
  /** The article to display/edit, or null if sheet should be empty */
  article: HelpArticleWithMeta | null;
  /** Whether the sheet is open */
  open: boolean;
  /** Handler for open state changes */
  onOpenChange: (open: boolean) => void;
  /** Handler for saving article changes */
  onSave: (id: string, data: { title: string; content: string; category_id: string; featured_image: string | null }) => Promise<void>;
  /** Handler for deleting the article */
  onDelete: (id: string) => void;
  /** Handler for re-embedding the article */
  onReembed?: (id: string) => Promise<void>;
  /** Available categories for selection */
  categories: HelpCategory[];
  /** Agent ID for image uploads */
  agentId: string;
  /** User ID for image uploads */
  userId: string;
}

export const ArticleDetailsSheet: React.FC<ArticleDetailsSheetProps> = ({
  article,
  open,
  onOpenChange,
  onSave,
  onDelete,
  onReembed,
  categories,
  agentId,
  userId,
}) => {
  // Defer content mounting until after sheet animation starts
  const [contentReady, setContentReady] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isReembedding, setIsReembedding] = useState(false);
  const [featuredImageUploading, setFeaturedImageUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form when article changes
  useEffect(() => {
    if (article) {
      setTitle(article.title);
      setContent(article.content);
      setCategoryId(article.category_id);
      setFeaturedImage(article.featured_image);
      setHasChanges(false);
    }
  }, [article]);

  // Defer content mounting
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setContentReady(true), 50);
      return () => clearTimeout(timer);
    } else {
      setContentReady(false);
    }
  }, [open]);

  // Track changes
  useEffect(() => {
    if (!article) return;
    const changed = 
      title !== article.title ||
      content !== article.content ||
      categoryId !== article.category_id ||
      featuredImage !== article.featured_image;
    setHasChanges(changed);
  }, [title, content, categoryId, featuredImage, article]);

  const handleSave = async () => {
    if (!article) return;
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!content.trim()) {
      toast.error('Content is required');
      return;
    }
    if (!categoryId) {
      toast.error('Category is required');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(article.id, {
        title: title.trim(),
        content,
        category_id: categoryId,
        featured_image: featuredImage,
      });
      toast.success('Article saved');
      setHasChanges(false);
    } catch (error) {
      toast.error('Failed to save article');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReembed = async () => {
    if (!article || !onReembed) return;
    try {
      setIsReembedding(true);
      await onReembed(article.id);
      toast.success('Article re-embedded');
    } catch (error) {
      toast.error('Failed to re-embed article');
    } finally {
      setIsReembedding(false);
    }
  };

  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    try {
      setFeaturedImageUploading(true);
      const imageUrl = await uploadFeaturedImage(file, userId, agentId);
      setFeaturedImage(imageUrl);
      toast.success('Featured image uploaded');
    } catch (error) {
      toast.error('Failed to upload featured image');
    } finally {
      setFeaturedImageUploading(false);
    }
  };

  const handleDelete = () => {
    if (!article) return;
    onDelete(article.id);
    onOpenChange(false);
  };

  // Get selected category info
  const selectedCategory = categories.find(c => c.id === categoryId);

  if (!article) return null;

  const hasEmbedding = !!article.embedding;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-start gap-3">
            {/* Thumbnail or placeholder */}
            {featuredImage ? (
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-muted">
                <img 
                  src={featuredImage} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="p-2.5 rounded-lg shrink-0 bg-accent">
                <File06 className="h-5 w-5 text-accent-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <SheetTitle className="truncate">{article.title}</SheetTitle>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant={hasEmbedding ? 'default' : 'secondary'} className="gap-1">
                  {hasEmbedding ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Embedded
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3" />
                      Not Embedded
                    </>
                  )}
                </Badge>
                {selectedCategory && (
                  <Badge variant="outline" className="gap-1.5">
                    <CategoryIcon name={selectedCategory.icon as CategoryIconName} className="h-3 w-3" />
                    {selectedCategory.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        {contentReady && (
          <div className="space-y-6">
            {/* Article Details Section */}
            <section className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Article Details</h3>
              
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="article-title">Title *</Label>
                <Input
                  id="article-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Article title"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="article-category">Category *</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="article-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <CategoryIcon name={(cat.icon as CategoryIconName) || 'book'} className="h-4 w-4" />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label>Content *</Label>
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Write your help article content here..."
                  agentId={agentId}
                  userId={userId}
                  minHeight="200px"
                />
              </div>
            </section>

            <Separator />

            {/* Featured Image Section */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Featured Image</h3>
              <p className="text-xs text-muted-foreground">
                This image will appear as a hero banner at the top of the article
              </p>
              
              {featuredImage ? (
                <div className="relative rounded-lg overflow-hidden">
                  <img 
                    src={featuredImage} 
                    alt="Featured" 
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="absolute top-2 right-2"
                    onClick={() => setFeaturedImage(null)}
                  >
                    <XClose className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFeaturedImageUpload}
                    className="hidden"
                    id="sheet-featured-image-upload"
                    disabled={featuredImageUploading}
                  />
                  <label htmlFor="sheet-featured-image-upload" className="cursor-pointer block">
                    {featuredImageUploading ? (
                      <div className="flex flex-col items-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent mb-2" />
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                      </div>
                    ) : (
                      <>
                        <Image01 className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Click to upload</p>
                        <p className="text-xs text-muted-foreground mt-1">Recommended: 1200×400px</p>
                      </>
                    )}
                  </label>
                </div>
              )}
            </section>

            <Separator />

            {/* Metadata Section */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Information</h3>
              
              <div className="space-y-2">
                {/* Created */}
                {article.created_at && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-20 shrink-0">Created</span>
                    <span className="text-sm flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {format(new Date(article.created_at), 'PPp')}
                      <span className="text-muted-foreground ml-1">
                        ({formatDistanceToNow(new Date(article.created_at), { addSuffix: true })})
                      </span>
                    </span>
                  </div>
                )}

                {/* Updated */}
                {article.updated_at && article.updated_at !== article.created_at && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-20 shrink-0">Updated</span>
                    <span className="text-sm">
                      {formatDistanceToNow(new Date(article.updated_at), { addSuffix: true })}
                    </span>
                  </div>
                )}

                {/* Embedding Status */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-20 shrink-0">Embedding</span>
                  <span className="text-sm flex items-center gap-1">
                    {hasEmbedding ? (
                      <>
                        <CheckCircle className="h-3 w-3 text-success" />
                        <span className="text-success">Ready for RAG</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Not embedded</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Re-embed warning if needed */}
              {!hasEmbedding && onReembed && (
                <div className="p-3 rounded-md bg-warning/10 border border-warning/20">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-warning">Not Embedded</p>
                        <p className="text-xs text-muted-foreground">
                          This article needs to be embedded for AI to use it in responses.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleReembed}
                        disabled={isReembedding}
                        className="h-7 text-xs"
                      >
                        <RefreshCcw01 className={`h-3 w-3 mr-1 ${isReembedding ? 'animate-spin' : ''}`} />
                        {isReembedding ? 'Embedding...' : 'Embed Now'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <Separator />

            {/* Actions Footer */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Actions</h3>
              
              <div className="flex flex-wrap gap-2">
                {/* Save Changes */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={isSaving || !hasChanges}
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {hasChanges ? 'Save your changes' : 'No changes to save'}
                  </TooltipContent>
                </Tooltip>

                {/* Re-embed */}
                {onReembed && hasEmbedding && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleReembed}
                        disabled={isReembedding}
                      >
                        <RefreshCcw01 className={`h-4 w-4 mr-2 ${isReembedding ? 'animate-spin' : ''}`} />
                        {isReembedding ? 'Embedding...' : 'Re-embed'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Re-generate embedding for this article</TooltipContent>
                  </Tooltip>
                )}

                {/* Delete */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={handleDelete}
                    >
                      <Trash01 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Permanently delete this article</TooltipContent>
                </Tooltip>
              </div>
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
