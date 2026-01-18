/**
 * Article Editor Page
 * 
 * Full-page, Craft-inspired article editor for Platform Help Center.
 * Features three-panel layout with ToC, WYSIWYG editor, and insert panel.
 * 
 * @see docs/ARTICLE_EDITOR.md for implementation details
 * @module pages/admin/ArticleEditorPage
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen01 } from '@untitledui/icons';
import { useTopBar, TopBarPageContext } from '@/components/layout/TopBar';
import { usePlatformHCArticles } from '@/hooks/admin/usePlatformHCArticles';
import { usePlatformHCCategories } from '@/hooks/admin/usePlatformHCCategories';
import { useAutoSave } from '@/hooks/useAutoSave';
import { ArticleEditor, type ArticleEditorRef } from '@/components/admin/knowledge/ArticleEditor';
import { HCTableOfContents } from '@/components/help-center/HCTableOfContents';
import { EditorInsertPanel } from '@/components/admin/knowledge/EditorInsertPanel';
import { EditorMetadataPanel } from '@/components/admin/knowledge/EditorMetadataPanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { IconButton } from '@/components/ui/icon-button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { PlatformHCArticleInput } from '@/types/platform-hc';

interface Heading {
  id: string;
  text: string;
  level: number;
}

/**
 * Extracts headings from HTML content for table of contents.
 */
function extractHeadingsFromHTML(html: string): Heading[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const headingElements = doc.querySelectorAll('h1, h2, h3');
  
  const headings: Heading[] = [];
  headingElements.forEach((el, index) => {
    const tagName = el.tagName.toLowerCase();
    const level = parseInt(tagName.replace('h', ''), 10);
    const text = el.textContent?.trim() || '';
    
    if (text) {
      headings.push({
        id: `heading-${index}`,
        text,
        level,
      });
    }
  });
  
  return headings;
}

/**
 * Generate a URL-friendly slug from title.
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function ArticleEditorPage() {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const isNewArticle = articleId === 'new' || !articleId;
  const editorRef = React.useRef<ArticleEditorRef>(null);
  
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
  const [isPublished, setIsPublished] = useState(true);
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);
  
  // Extracted headings for ToC
  const [headings, setHeadings] = useState<Heading[]>([]);
  
  // Track if we've loaded the article data
  const [hasLoaded, setHasLoaded] = useState(false);
  
  // Load existing article data
  useEffect(() => {
    if (existingArticle && !hasLoaded) {
      setTitle(existingArticle.title);
      setContent(existingArticle.content);
      setSlug(existingArticle.slug);
      setCategoryId(existingArticle.category_id);
      setDescription(existingArticle.description || '');
      setOrderIndex(existingArticle.order_index || 0);
      setIconName(existingArticle.icon_name || '');
      setIsPublished(existingArticle.is_published);
      setHeadings(extractHeadingsFromHTML(existingArticle.content));
      setHasLoaded(true);
    } else if (isNewArticle && !hasLoaded && categories.length > 0) {
      // Set default category for new articles
      setCategoryId(categories[0]?.id || '');
      setHasLoaded(true);
    }
  }, [existingArticle, hasLoaded, isNewArticle, categories]);
  
  // Extract headings when content changes
  const handleContentChange = useCallback((html: string) => {
    setContent(html);
    setHeadings(extractHeadingsFromHTML(html));
  }, []);
  
  // Auto-generate slug from title
  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
    // Only auto-generate slug if it's empty or matches the old auto-generated slug
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(newTitle));
    }
  }, [slug, title]);
  
  // Auto-save handler
  const { save } = useAutoSave<PlatformHCArticleInput>({
    onSave: async (data) => {
      if (isNewArticle) {
        await createArticle(data);
        // After creating, the list will refresh and we'll navigate when we get the new article ID
        // For now, just stay on the page - could improve this with a return value
      } else if (articleId) {
        await updateArticle(articleId, data);
      }
    },
    debounceMs: 2000,
  });
  
  // Trigger auto-save on changes (only after initial load)
  useEffect(() => {
    if (!hasLoaded || !title || !categoryId) return;
    
    save({
      title,
      content,
      slug: slug || generateSlug(title),
      category_id: categoryId,
      description,
      order_index: orderIndex,
      icon_name: iconName || undefined,
      is_published: isPublished,
    });
  }, [title, content, slug, categoryId, description, orderIndex, iconName, isPublished, hasLoaded, save]);
  
  // Handle back navigation
  const handleBack = useCallback(() => {
    navigate('/admin/knowledge');
  }, [navigate]);
  
  // Configure TopBar
  const topBarConfig = useMemo(() => ({
    left: (
      <div className="flex items-center gap-2">
        <IconButton 
          label="Back to Knowledge" 
          variant="ghost" 
          size="sm"
          onClick={handleBack}
        >
          <ArrowLeft size={16} />
        </IconButton>
        <span className="text-muted-foreground">/</span>
        <TopBarPageContext icon={BookOpen01} title="Knowledge" />
        <span className="text-muted-foreground">/</span>
        <Input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Untitled Article"
          className="border-0 bg-transparent font-medium text-sm h-8 w-auto min-w-[200px] max-w-[400px] focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
    ),
    right: (
      <div className="flex items-center gap-3">
        <Badge variant={isPublished ? 'default' : 'secondary'}>
          {isPublished ? 'Published' : 'Draft'}
        </Badge>
        <Switch 
          checked={isPublished} 
          onCheckedChange={setIsPublished}
          aria-label="Toggle publish status"
        />
      </div>
    ),
  }), [title, isPublished, handleBack, handleTitleChange]);
  
  useTopBar(topBarConfig);
  
  // Show loading skeleton
  if (articlesLoading && !isNewArticle) {
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
  
  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Main three-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Table of Contents */}
        <aside className="w-[200px] border-r border-border bg-background flex-shrink-0">
          <ScrollArea className="h-full">
            <HCTableOfContents headings={headings} />
          </ScrollArea>
        </aside>
        
        {/* Center - Main Editor */}
        <main className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1">
            <div className="max-w-4xl mx-auto py-6 px-8">
              <ArticleEditor
                ref={editorRef}
                content={content}
                onChange={handleContentChange}
                placeholder="Start writing your article..."
                className="border-0 shadow-none"
              />
            </div>
          </ScrollArea>
        </main>
        
        {/* Right Sidebar - Insert Panel */}
        <EditorInsertPanel onInsert={(blockType) => editorRef.current?.insertBlock(blockType)} />
      </div>
      
      {/* Bottom - Metadata Panel */}
      <EditorMetadataPanel
        isOpen={isMetadataOpen}
        onOpenChange={setIsMetadataOpen}
        slug={slug}
        onSlugChange={setSlug}
        categoryId={categoryId}
        onCategoryChange={setCategoryId}
        categories={categories}
        description={description}
        onDescriptionChange={setDescription}
        orderIndex={orderIndex}
        onOrderIndexChange={setOrderIndex}
        iconName={iconName}
        onIconNameChange={setIconName}
      />
    </div>
  );
}
