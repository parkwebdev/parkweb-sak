/**
 * Article Editor Page
 * 
 * Full-page, Craft-inspired article editor for Platform Help Center.
 * Features three-panel layout with ToC, WYSIWYG editor, and insert panel.
 * 
 * Draft/Publish Workflow:
 * - Auto-saves as draft after 3 seconds of inactivity
 * - Manual "Publish" button to make content live
 * - "Unpublish" to revert to draft state
 * 
 * @see docs/ARTICLE_EDITOR.md for implementation details
 * @module pages/admin/ArticleEditorPage
 */

import React, { useState, useCallback, useMemo, useEffect, useRef, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, BookOpen01 } from '@untitledui/icons';
import { useTopBar, TopBarPageContext } from '@/components/layout/TopBar';
import { usePlatformHCArticles } from '@/hooks/admin/usePlatformHCArticles';
import { usePlatformHCCategories } from '@/hooks/admin/usePlatformHCCategories';
import { ArticleEditor, type ArticleEditorRef, type Heading } from '@/components/admin/knowledge/ArticleEditor';
import { HCTableOfContents } from '@/components/help-center/HCTableOfContents';
import { EditorInsertPanel } from '@/components/admin/knowledge/EditorInsertPanel';
import { EditorMetadataPanel } from '@/components/admin/knowledge/EditorMetadataPanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/admin/shared/StatusBadge';
import { toast } from 'sonner';
import { getErrorMessage } from '@/types/errors';
import { formatDistanceToNow } from 'date-fns';
import type { PlatformHCArticleInput } from '@/types/platform-hc';


/**
 * Generate a URL-friendly slug from title.
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Debounce time for draft auto-save (3 seconds) */
const DRAFT_SAVE_DELAY_MS = 3000;

/**
 * TopBar Left Content - Memoized for stability
 */
interface TopBarLeftProps {
  title: string;
  onTitleChange: (value: string) => void;
  onBack: () => void;
}

const TopBarLeft = memo(function TopBarLeft({ title, onTitleChange, onBack }: TopBarLeftProps) {
  return (
    <div className="flex items-center gap-2">
      <IconButton 
        label="Back to Knowledge" 
        variant="ghost" 
        size="sm"
        onClick={onBack}
      >
        <ArrowLeft size={16} />
      </IconButton>
      <span className="text-muted-foreground">/</span>
      <TopBarPageContext icon={BookOpen01} title="Knowledge" />
      <span className="text-muted-foreground">/</span>
      <Input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Untitled Article"
        className="border-0 bg-transparent font-medium text-sm h-8 w-auto min-w-[200px] max-w-[400px] focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>
  );
});

/**
 * TopBar Right Content - Memoized for stability
 */
interface TopBarRightProps {
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  lastSavedAt: Date | null;
  isPublished: boolean;
  canPublish: boolean;
  onPublish: () => void;
  onUnpublish: () => void;
}

const TopBarRight = memo(function TopBarRight({
  isSaving,
  hasUnsavedChanges,
  lastSavedAt,
  isPublished,
  canPublish,
  onPublish,
  onUnpublish,
}: TopBarRightProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Draft save status indicator */}
      {isSaving && (
        <span className="text-xs text-muted-foreground animate-pulse">Saving...</span>
      )}
      {!isSaving && hasUnsavedChanges && (
        <span className="text-xs text-muted-foreground">Unsaved changes</span>
      )}
      {!isSaving && !hasUnsavedChanges && lastSavedAt && (
        <span className="text-xs text-muted-foreground">
          Saved {formatDistanceToNow(lastSavedAt, { addSuffix: true })}
        </span>
      )}
      
      {/* Status badge */}
      <StatusBadge status={isPublished ? 'Published' : 'Draft'} />
      
      {/* Publish/Unpublish button */}
      {isPublished ? (
        <Button 
          size="sm" 
          onClick={onUnpublish} 
          disabled={isSaving}
        >
          Unpublish
        </Button>
      ) : (
        <Button 
          size="sm" 
          onClick={onPublish} 
          disabled={isSaving || !canPublish}
        >
          Publish
        </Button>
      )}
    </div>
  );
});

export function ArticleEditorPage() {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNewArticle = articleId === 'new' || !articleId;
  const editorRef = useRef<ArticleEditorRef>(null);
  const editorScrollRef = useRef<HTMLDivElement>(null);
  const draftSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { articles, loading: articlesLoading, createArticle, updateArticle } = usePlatformHCArticles();
  const { categories } = usePlatformHCCategories();
  
  // Find existing article if editing
  const existingArticle = useMemo(() => {
    if (isNewArticle) return null;
    return articles.find(a => a.id === articleId) || null;
  }, [articles, articleId, isNewArticle]);
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [orderIndex, setOrderIndex] = useState(0);
  const [iconName, setIconName] = useState('');
  const [isPublished, setIsPublished] = useState(false); // Default to draft
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);
  
  // Extracted headings for ToC
  const [headings, setHeadings] = useState<Heading[]>([]);
  
  // Track which article ID we've loaded (null = not loaded yet)
  const [loadedArticleId, setLoadedArticleId] = useState<string | null>(null);
  
  // Draft save state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  
  // Reset state when articleId changes (navigating between articles)
  useEffect(() => {
    // If we're navigating to a different article, reset the loaded state
    if (!isNewArticle && articleId && loadedArticleId !== null && loadedArticleId !== articleId) {
      setLoadedArticleId(null);
      setHasUnsavedChanges(false);
      setLastSavedAt(null);
    }
  }, [articleId, isNewArticle, loadedArticleId]);
  
  // Load existing article data
  useEffect(() => {
    if (existingArticle && loadedArticleId !== existingArticle.id) {
      setTitle(existingArticle.title);
      setContent(existingArticle.content);
      setSlug(existingArticle.slug);
      setCategoryId(existingArticle.category_id);
      setDescription(existingArticle.description || '');
      setOrderIndex(existingArticle.order_index || 0);
      setIconName(existingArticle.icon_name || '');
      setIsPublished(existingArticle.is_published);
      setLoadedArticleId(existingArticle.id);
    } else if (isNewArticle && loadedArticleId !== 'new' && categories.length > 0) {
      // Set default category for new articles
      setCategoryId(categories[0]?.id || '');
      setLoadedArticleId('new');
    }
  }, [existingArticle, loadedArticleId, isNewArticle, categories]);
  
  // Handle content changes from editor (user edits only)
  const handleContentChange = useCallback((html: string) => {
    setContent(html);
    // Content changes are only triggered by user edits (not hydration)
    // so we can safely mark as unsaved
    setHasUnsavedChanges(true);
  }, []);
  
  // Handle headings changes from editor (can be called during hydration)
  const handleHeadingsChange = useCallback((extractedHeadings: Heading[]) => {
    setHeadings(extractedHeadings);
  }, []);
  
  // Auto-generate slug from title
  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle((prevTitle) => {
      // Only auto-generate slug if it's empty or matches the old auto-generated slug
      setSlug((prevSlug) => {
        if (!prevSlug || prevSlug === generateSlug(prevTitle)) {
          return generateSlug(newTitle);
        }
        return prevSlug;
      });
      return newTitle;
    });
    setHasUnsavedChanges(true);
  }, []);
  
  // Build current form data for save operations
  const currentFormData = useMemo((): PlatformHCArticleInput => ({
    title,
    content,
    slug: slug || generateSlug(title),
    category_id: categoryId,
    description,
    order_index: orderIndex,
    icon_name: iconName || undefined,
    is_published: isPublished,
  }), [title, content, slug, categoryId, description, orderIndex, iconName, isPublished]);
  
  // Ref for current form data to avoid stale closures
  const currentFormDataRef = useRef(currentFormData);
  currentFormDataRef.current = currentFormData;
  
  // Check if content is essentially empty (just empty paragraph tags)
  const isContentEmpty = useCallback((htmlContent: string): boolean => {
    // Strip HTML tags and whitespace to check for actual content
    const textContent = htmlContent.replace(/<[^>]*>/g, '').trim();
    // Also check if it's just empty paragraph(s)
    const justEmptyParagraphs = /^(<p>\s*<\/p>\s*)*$/.test(htmlContent.trim());
    return textContent.length === 0 || justEmptyParagraphs;
  }, []);
  
  // Save draft (auto-save or manual) - stable callback using refs
  const saveDraft = useCallback(async () => {
    const formData = currentFormDataRef.current;
    if (!formData.title || !formData.category_id) return;
    
    // Guard: Don't save if content is empty but article previously had content
    if (isContentEmpty(formData.content)) {
      // If this is an existing article, don't save empty content
      if (!isNewArticle && existingArticle && !isContentEmpty(existingArticle.content)) {
        console.warn('Prevented saving empty content over existing article content');
        return;
      }
    }
    
    setIsSaving(true);
    try {
      if (isNewArticle) {
        const newId = await createArticle(formData);
        // Navigate to the created article to prevent duplicate inserts on subsequent saves
        navigate(`/admin/knowledge/${newId}`, { replace: true });
        setHasUnsavedChanges(false);
        setLastSavedAt(new Date());
        return;
      } else if (articleId) {
        await updateArticle(articleId, formData);
      }
      
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date());
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      if (message.includes('duplicate key') || message.includes('unique constraint')) {
        toast.error('Slug conflict', { 
          description: 'An article with this slug already exists in this category. Please use a different title or slug.' 
        });
      } else {
        toast.error('Failed to save draft', { description: message });
      }
    } finally {
      setIsSaving(false);
    }
  }, [isNewArticle, articleId, createArticle, updateArticle, isContentEmpty, existingArticle, navigate]);
  
  // Publish article - stable callback using refs
  const handlePublish = useCallback(async () => {
    const formData = currentFormDataRef.current;
    if (!formData.title || !formData.category_id) {
      toast.error('Cannot publish', { description: 'Title and category are required.' });
      return;
    }
    
    setIsSaving(true);
    try {
      const publishData: PlatformHCArticleInput = {
        ...formData,
        is_published: true,
      };
      
      if (isNewArticle) {
        const newId = await createArticle(publishData);
        // Navigate to the created article to prevent duplicate inserts
        navigate(`/admin/knowledge/${newId}`, { replace: true });
        setIsPublished(true);
        setHasUnsavedChanges(false);
        setLastSavedAt(new Date());
        toast.success('Article published');
        return;
      } else if (articleId) {
        await updateArticle(articleId, publishData);
      }
      
      setIsPublished(true);
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date());
      toast.success('Article published');
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      if (message.includes('duplicate key') || message.includes('unique constraint')) {
        toast.error('Slug conflict', { 
          description: 'An article with this slug already exists in this category. Please use a different title or slug.' 
        });
      } else {
        toast.error('Failed to publish', { description: message });
      }
    } finally {
      setIsSaving(false);
    }
  }, [isNewArticle, articleId, createArticle, updateArticle, navigate]);
  
  // Unpublish article (revert to draft) - stable callback
  const handleUnpublish = useCallback(async () => {
    if (!articleId) return;
    
    setIsSaving(true);
    try {
      await updateArticle(articleId, { is_published: false });
      setIsPublished(false);
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date());
      toast.success('Article reverted to draft');
    } catch (error: unknown) {
      toast.error('Failed to unpublish', { description: getErrorMessage(error) });
    } finally {
      setIsSaving(false);
    }
  }, [articleId, updateArticle]);
  
  // Debounced draft auto-save (3 seconds after last change)
  useEffect(() => {
    if (!loadedArticleId || !hasUnsavedChanges || !title || !categoryId) return;
    
    // Clear existing timeout
    if (draftSaveTimeoutRef.current) {
      clearTimeout(draftSaveTimeoutRef.current);
    }
    
    // Set new timeout for auto-save
    draftSaveTimeoutRef.current = setTimeout(() => {
      saveDraft();
    }, DRAFT_SAVE_DELAY_MS);
    
    return () => {
      if (draftSaveTimeoutRef.current) {
        clearTimeout(draftSaveTimeoutRef.current);
      }
    };
  }, [loadedArticleId, hasUnsavedChanges, title, categoryId, saveDraft]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (draftSaveTimeoutRef.current) {
        clearTimeout(draftSaveTimeoutRef.current);
      }
    };
  }, []);
  
  // Keyboard shortcuts: Cmd+S for force save, Escape for deselect/close panels
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+S: Force save draft
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveDraft();
        return;
      }
      
      // Escape: Close metadata panel or deselect in editor
      if (e.key === 'Escape') {
        if (isMetadataOpen) {
          setIsMetadataOpen(false);
          return;
        }
        // Blur editor to deselect
        if (editorRef.current?.editor) {
          editorRef.current.editor.commands.blur();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveDraft, isMetadataOpen]);
  
  // Handle back navigation - stable callback
  const handleBack = useCallback(() => {
    navigate('/admin/knowledge');
  }, [navigate]);
  
  // Derived value for publish button enablement
  const canPublish = Boolean(title && categoryId);
  
  // ============= Ref-based stable callback wrappers =============
  // Route action callbacks through refs so topBarConfig dependencies
  // don't change when the underlying callbacks are recreated
  const handlePublishRef = useRef(handlePublish);
  const handleUnpublishRef = useRef(handleUnpublish);
  const handleTitleChangeRef = useRef(handleTitleChange);
  const handleBackRef = useRef(handleBack);
  
  // Keep refs updated with latest callbacks
  handlePublishRef.current = handlePublish;
  handleUnpublishRef.current = handleUnpublish;
  handleTitleChangeRef.current = handleTitleChange;
  handleBackRef.current = handleBack;
  
  // Stable wrappers that never change identity
  const onPublishStable = useCallback(() => handlePublishRef.current(), []);
  const onUnpublishStable = useCallback(() => handleUnpublishRef.current(), []);
  const onTitleChangeStable = useCallback((v: string) => handleTitleChangeRef.current(v), []);
  const onBackStable = useCallback(() => handleBackRef.current(), []);
  
  // Configure TopBar with memoized components and stable callbacks
  // Dependencies reduced to display state only - actions use stable wrappers
  const topBarConfig = useMemo(() => ({
    left: (
      <TopBarLeft
        title={title}
        onTitleChange={onTitleChangeStable}
        onBack={onBackStable}
      />
    ),
    right: (
      <TopBarRight
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        lastSavedAt={lastSavedAt}
        isPublished={isPublished}
        canPublish={canPublish}
        onPublish={onPublishStable}
        onUnpublish={onUnpublishStable}
      />
    ),
  }), [title, onTitleChangeStable, onBackStable, isSaving, hasUnsavedChanges, lastSavedAt, isPublished, canPublish, onPublishStable, onUnpublishStable]);
  
  useTopBar(topBarConfig, 'admin-article-editor');
  
  // Show loading skeleton while fetching or waiting for article data
  const isLoading = articlesLoading || (!isNewArticle && !existingArticle && !loadedArticleId);
  
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-56px)]">
        <div className="w-[200px] border-r border-border p-4">
          <Skeleton className="h-4 w-24 mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-[400px] w-full" />
        </div>
        <div className="w-[200px] border-l border-border p-4">
          <Skeleton className="h-4 w-20 mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // Show article not found if we're done loading but article doesn't exist
  if (!isNewArticle && !existingArticle) {
    return (
      <div className="flex h-[calc(100vh-56px)] items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Article not found</p>
          <Button variant="outline" onClick={handleBack}>
            Back to Knowledge
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Main three-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Table of Contents */}
        <aside className="w-[200px] border-r border-border bg-background flex-shrink-0">
          <ScrollArea className="h-full">
            <HCTableOfContents 
              headings={headings} 
              scrollContainerRef={editorScrollRef}
              showSearch={headings.length > 5}
            />
          </ScrollArea>
        </aside>
        
        {/* Center - Main Editor */}
        <main className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1">
            <div ref={editorScrollRef} className="max-w-4xl mx-auto py-6 px-8">
              <ArticleEditor
                ref={editorRef}
                content={content}
                onChange={handleContentChange}
                onHeadingsChange={handleHeadingsChange}
                placeholder="Start writing your article..."
                className="border-0 shadow-none"
                userId={user?.id || ''}
              />
            </div>
          </ScrollArea>
        </main>
        
        {/* Right Sidebar - Insert Panel */}
        <EditorInsertPanel 
          onInsert={(blockType) => editorRef.current?.insertBlock(blockType)}
          onInsertTable={(rows, cols) => editorRef.current?.insertTable(rows, cols)}
        />
      </div>
      
      {/* Bottom - Metadata Panel */}
      <EditorMetadataPanel
        isOpen={isMetadataOpen}
        onOpenChange={setIsMetadataOpen}
        slug={slug}
        onSlugChange={(value) => { setSlug(value); setHasUnsavedChanges(true); }}
        categoryId={categoryId}
        onCategoryChange={(value) => { setCategoryId(value); setHasUnsavedChanges(true); }}
        categories={categories}
        description={description}
        onDescriptionChange={(value) => { setDescription(value); setHasUnsavedChanges(true); }}
        orderIndex={orderIndex}
        onOrderIndexChange={(value) => { setOrderIndex(value); setHasUnsavedChanges(true); }}
        iconName={iconName}
        onIconNameChange={(value) => { setIconName(value); setHasUnsavedChanges(true); }}
      />
    </div>
  );
}
