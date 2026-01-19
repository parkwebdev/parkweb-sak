/**
 * HelpView Component
 * 
 * Help center view with categories, articles, search, and feedback collection.
 * Supports three navigation levels: categories, article list, article detail.
 * DOMPurify is lazy-loaded to reduce initial bundle size.
 * 
 * @module widget/views/HelpView
 */

import { useState, useEffect, useRef } from 'react';
import { WidgetButton, WidgetInput, WidgetSkeletonArticleContent, CSSAnimatedList, CSSAnimatedItem } from '../ui';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ThumbsUp, ThumbsDown, CheckCircle } from '../icons';
import { CategoryIcon } from '../category-icons';
import { submitArticleFeedback } from '../api';
import { getSessionId } from '../utils';
import { useSystemTheme } from '../hooks/useSystemTheme';
import type { WidgetConfig } from '../api';

// Lazy-load DOMPurify (~8KB savings from initial load)
let DOMPurify: typeof import('isomorphic-dompurify').default | null = null;
const loadDOMPurify = async () => {
  if (!DOMPurify) {
    const module = await import('isomorphic-dompurify');
    DOMPurify = module.default;
  }
  return DOMPurify;
};

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category_id?: string;
  category?: string;
  featured_image?: string;
}

interface HelpCategory {
  id: string;
  name: string;
  icon?: string;
}

interface HelpViewProps {
  config: WidgetConfig;
  helpCategories: HelpCategory[];
  helpArticles: HelpArticle[];
}

const ALLOWED_TAGS = [
  // Standard text elements
  'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'span',
  // Headings
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  // Links and media
  'a', 'img', 'iframe',
  // Lists
  'ul', 'ol', 'li',
  // Code
  'code', 'pre',
  // Structural (needed for custom blocks)
  'div', 'section', 'blockquote',
];

const ALLOWED_ATTR = [
  // Standard attributes
  'href', 'target', 'rel', 'class', 'id',
  'src', 'alt', 'width', 'height', 'style',
  // Video attributes
  'data-video', 'data-src', 'data-video-type', 'data-title', 'data-thumbnail',
  'allow', 'allowfullscreen', 'frameborder',
  // Callout attributes
  'data-callout', 'data-callout-type',
  // Step-by-step attributes
  'data-stepbystep', 'data-step', 'data-step-number',
  'data-step-title', 'data-step-description', 'data-step-screenshot',
  // Feature grid/card attributes
  'data-feature-grid', 'data-columns',
  'data-feature-card', 'data-feature-icon', 'data-feature-title', 'data-feature-description',
  // Related articles attributes
  'data-related-articles', 'data-articles',
  // Article link attributes
  'data-article-link', 'data-category-id', 'data-article-slug',
];

// Video utility functions for widget (lightweight, no external dependencies)
function extractYouTubeId(url: string): string | null {
  const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
  if (watchMatch) return watchMatch[1];
  const shortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (shortMatch) return shortMatch[1];
  const embedMatch = url.match(/youtube\.com\/embed\/([^?]+)/);
  if (embedMatch) return embedMatch[1];
  return null;
}

function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

function extractLoomId(url: string): string | null {
  const match = url.match(/loom\.com\/share\/([^?]+)/);
  return match ? match[1] : null;
}

function getEmbedUrl(url: string, type: string): string {
  switch (type) {
    case 'youtube': {
      const id = extractYouTubeId(url);
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : url;
    }
    case 'vimeo': {
      const id = extractVimeoId(url);
      return id ? `https://player.vimeo.com/video/${id}?autoplay=1` : url;
    }
    case 'loom': {
      const id = extractLoomId(url);
      return id ? `https://www.loom.com/embed/${id}` : url;
    }
    default:
      return url;
  }
}

function getVideoThumbnail(url: string, type: string, customThumbnail?: string): string | null {
  if (customThumbnail) return customThumbnail;
  if (type === 'youtube') {
    const id = extractYouTubeId(url);
    if (id) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  }
  return null;
}

/** Hydrate video blocks in article content with click-to-play functionality */
function hydrateVideoBlocks(container: HTMLElement) {
  const videoElements = container.querySelectorAll('[data-video]');
  
  videoElements.forEach((el) => {
    const element = el as HTMLElement;
    const src = element.getAttribute('data-src') || '';
    const videoType = element.getAttribute('data-video-type') || 'self-hosted';
    const title = element.getAttribute('data-title') || 'Video';
    const thumbnail = element.getAttribute('data-thumbnail') || '';
    
    // Skip if already hydrated
    if (element.dataset.hydrated === 'true') return;
    element.dataset.hydrated = 'true';
    
    const thumbnailUrl = getVideoThumbnail(src, videoType, thumbnail);
    const embedUrl = getEmbedUrl(src, videoType);
    
    // Create thumbnail with play button
    element.innerHTML = `
      <div class="widget-video-container" style="position: relative; width: 100%; aspect-ratio: 16/9; background: var(--muted); border-radius: 8px; overflow: hidden; cursor: pointer;">
        ${thumbnailUrl ? `<img src="${thumbnailUrl}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover;" />` : ''}
        <div class="widget-video-play" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3);">
          <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.9); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 5.14v13.72a1 1 0 001.5.86l11-6.86a1 1 0 000-1.72l-11-6.86A1 1 0 008 5.14z" fill="currentColor"/>
            </svg>
          </div>
        </div>
      </div>
    `;
    
    // Add click handler to replace with iframe
    element.addEventListener('click', () => {
      element.innerHTML = `
        <iframe
          src="${embedUrl}"
          title="${title}"
          style="width: 100%; aspect-ratio: 16/9; border: none; border-radius: 8px;"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      `;
    }, { once: true });
  });
}

export const HelpView = ({
  config,
  helpCategories,
  helpArticles,
}: HelpViewProps) => {
  const [helpSearchQuery, setHelpSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [articleFeedback, setArticleFeedback] = useState<'helpful' | 'not_helpful' | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showFeedbackComment, setShowFeedbackComment] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [sanitizedContent, setSanitizedContent] = useState<string>('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const articleContentRef = useRef<HTMLDivElement>(null);
  const systemTheme = useSystemTheme();

  // Theme-aware colors: white in dark mode, black in light mode (inverted high-contrast)
  const accentColor = systemTheme === 'dark' ? '#FFFFFF' : '#000000';
  const buttonTextColor = systemTheme === 'dark' ? '#000000' : '#FFFFFF';

  // Lazy-load and sanitize article content
  useEffect(() => {
    if (!selectedArticle) {
      setSanitizedContent('');
      return;
    }
    
    setIsLoadingContent(true);
    loadDOMPurify().then(purify => {
      const clean = purify.sanitize(selectedArticle.content, {
        ALLOWED_TAGS,
        ALLOWED_ATTR,
      });
      setSanitizedContent(clean);
      setIsLoadingContent(false);
    });
  }, [selectedArticle]);

  // Hydrate video blocks after content is rendered
  useEffect(() => {
    if (!sanitizedContent || isLoadingContent) return;
    
    // Small delay to ensure DOM is updated
    const timer = setTimeout(() => {
      if (articleContentRef.current) {
        hydrateVideoBlocks(articleContentRef.current);
      }
    }, 50);
    
    return () => clearTimeout(timer);
  }, [sanitizedContent, isLoadingContent]);

  const filteredArticles = helpArticles.filter(article => {
    const matchesSearch = !helpSearchQuery || article.title.toLowerCase().includes(helpSearchQuery.toLowerCase()) || article.content.toLowerCase().includes(helpSearchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || article.category_id === selectedCategory || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmitFeedback = async () => {
    if (!selectedArticle || articleFeedback === null) return;
    try {
      const sessionId = getSessionId();
      await submitArticleFeedback(selectedArticle.id, { sessionId, isHelpful: articleFeedback === 'helpful', comment: feedbackComment });
      setFeedbackSubmitted(true);
    } catch (error: unknown) {
      // Feedback error handled silently in production
    }
  };

  const resetArticleState = () => {
    setSelectedArticle(null);
    setArticleFeedback(null);
    setShowFeedbackComment(false);
    setFeedbackComment('');
    setFeedbackSubmitted(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden widget-view-enter">
      {/* Level 1: Categories List / Search Results (No category selected) */}
      {!selectedCategory && !selectedArticle && (
        <>
          <div className="p-4 border-b bg-muted/50">
            {helpSearchQuery ? (
              <div className="flex items-center gap-2 mb-3">
                <WidgetButton 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setHelpSearchQuery('')}
                  className="h-8"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                </WidgetButton>
                <h3 className="text-lg font-semibold">Search Results</h3>
              </div>
            ) : null}
            <WidgetInput
              value={helpSearchQuery}
              onChange={(e) => setHelpSearchQuery(e.target.value)}
              placeholder="Search help articles..."
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {helpSearchQuery ? (
              // Search Results
              filteredArticles.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8 widget-animated-item">
                  No articles found
                </p>
              ) : (
                <CSSAnimatedList className="space-y-2" staggerDelay={0.1}>
                  {filteredArticles.map((article) => (
                    <CSSAnimatedItem key={article.id}>
                      <div
                        className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedArticle(article);
                          setHelpSearchQuery('');
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-sm flex-1">{article.title}</h4>
                          {article.category && (
                            <Badge variant="secondary" className="flex-shrink-0">
                              {article.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CSSAnimatedItem>
                  ))}
                </CSSAnimatedList>
              )
            ) : (
              // Categories List
              helpCategories.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8 widget-animated-item">
                  No categories available
                </p>
              ) : (
                <CSSAnimatedList className="space-y-2" staggerDelay={0.1}>
                  {helpCategories.map((category) => {
                    const articlesInCategory = helpArticles.filter(
                      a => a.category_id === category.id || a.category === category.name
                    ).length;
                    
                    return (
                      <CSSAnimatedItem key={category.id}>
                        <button
                          className="w-full px-3 py-2.5 border rounded-lg bg-card hover:bg-accent/50 cursor-pointer transition-colors text-left"
                          onClick={() => setSelectedCategory(category.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="p-2 rounded-lg flex-shrink-0"
                              style={{ backgroundColor: `${config.gradientStartColor}30` }}
                            >
                              <CategoryIcon 
                                name={category.icon} 
                                className="h-5 w-5" 
                                style={{ color: config.gradientStartColor }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm">{category.name}</h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {articlesInCategory} {articlesInCategory === 1 ? 'article' : 'articles'}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          </div>
                        </button>
                      </CSSAnimatedItem>
                    );
                  })}
                </CSSAnimatedList>
              )
            )}
          </div>
        </>
      )}

      {/* Level 2: Articles in Category (Category selected, no article) */}
      {selectedCategory && !selectedArticle && (
        <>
          <div className="p-4 border-b bg-muted/50">
            <div className="flex items-center gap-2 mb-3">
              <WidgetButton 
                size="sm" 
                variant="ghost" 
                onClick={() => {
                  setSelectedCategory(null);
                  setHelpSearchQuery('');
                }}
                className="h-8"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
              </WidgetButton>
              <h3 className="text-lg font-semibold">
                {helpCategories.find(c => c.id === selectedCategory)?.name || 'Articles'}
              </h3>
            </div>
            <WidgetInput
              value={helpSearchQuery}
              onChange={(e) => setHelpSearchQuery(e.target.value)}
              placeholder="Search in this category..."
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {filteredArticles.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8 widget-animated-item">
                No articles in this category
              </p>
            ) : (
              <CSSAnimatedList className="space-y-2" staggerDelay={0.1}>
                {filteredArticles.map((article) => (
                  <CSSAnimatedItem key={article.id}>
                    <button
                      className="w-full p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors text-left"
                      onClick={() => setSelectedArticle(article)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-medium text-sm flex-1">{article.title}</h4>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </button>
                  </CSSAnimatedItem>
                ))}
              </CSSAnimatedList>
            )}
          </div>
        </>
      )}

      {/* Level 3: Article Content with Feedback */}
      {selectedArticle && (
        <div className="flex-1 flex flex-col overflow-hidden widget-content-enter">
          {/* Scrollable Article Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Hero Section - Only shown if featured_image exists */}
            {selectedArticle.featured_image ? (
              <>
                <div 
                  className="relative h-48 bg-cover bg-center"
                  style={{ backgroundImage: `url(${selectedArticle.featured_image})` }}
                >
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
                  
                  {/* Back Button - Top Left */}
                  <WidgetButton 
                    size="sm" 
                    variant="ghost" 
                    onClick={resetArticleState}
                    className="absolute top-3 left-3 text-white hover:bg-white/20 hover:text-white"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
                    Back
                  </WidgetButton>
                  
                  {/* Title - Bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h2 className="text-xl font-bold text-white drop-shadow-lg">{selectedArticle.title}</h2>
                  </div>
                </div>
                
                {/* Article Content below hero */}
                <div className="p-4">
                  {isLoadingContent ? (
                    <WidgetSkeletonArticleContent lines={3} />
                  ) : (
                    <div 
                      ref={articleContentRef}
                      className="article-content max-w-none" 
                      dangerouslySetInnerHTML={{ __html: sanitizedContent }} 
                    />
                  )}
                </div>
              </>
            ) : (
              /* Standard layout for articles without featured image */
              <div className="p-4">
                {/* Back button and title */}
                <div className="flex items-center gap-2 mb-4">
                  <WidgetButton 
                    size="sm" 
                    variant="ghost" 
                    onClick={resetArticleState}
                    className="h-8"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                  </WidgetButton>
                  <h2 className="text-lg font-semibold">{selectedArticle.title}</h2>
                </div>
                
                {/* Article content */}
                {isLoadingContent ? (
                  <WidgetSkeletonArticleContent lines={3} />
                ) : (
                  <div 
                    ref={articleContentRef}
                    className="article-content max-w-none" 
                    dangerouslySetInnerHTML={{ __html: sanitizedContent }} 
                  />
                )}
              </div>
            )}
          </div>
          
          {/* Feedback Section - pinned at bottom of container */}
          <div className="flex-shrink-0 p-4 border-t bg-muted/30 animate-fade-in">
            {feedbackSubmitted ? (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="text-sm font-medium">Thanks for your feedback!</p>
                <p className="text-xs text-muted-foreground mt-1">Your input helps us improve.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium text-center text-foreground">Was this article helpful?</p>
                <div className="flex justify-center gap-3">
                  <WidgetButton
                    size="sm"
                    variant={articleFeedback === 'helpful' ? 'default' : 'outline'}
                    onClick={() => {
                      setArticleFeedback('helpful');
                      setShowFeedbackComment(true);
                    }}
                    className={`gap-1.5 ${
                      articleFeedback === 'helpful'
                        ? 'bg-foreground text-background hover:bg-foreground/90 border border-transparent'
                        : ''
                    }`}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Yes
                  </WidgetButton>
                  <WidgetButton
                    size="sm"
                    variant={articleFeedback === 'not_helpful' ? 'default' : 'outline'}
                    onClick={() => {
                      setArticleFeedback('not_helpful');
                      setShowFeedbackComment(true);
                    }}
                    className={`gap-1.5 ${
                      articleFeedback === 'not_helpful'
                        ? 'bg-foreground text-background hover:bg-foreground/90 border border-transparent'
                        : ''
                    }`}
                  >
                    <ThumbsDown className="h-4 w-4" />
                    No
                  </WidgetButton>
                </div>
                
                {showFeedbackComment && (
                  <div className="space-y-2 mt-3 animate-fade-in">
                    <Textarea
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder={articleFeedback === 'helpful' ? "What did you find most helpful? (optional)" : "How can we improve this article? (optional)"}
                      className="text-sm resize-none"
                      rows={3}
                    />
                    <WidgetButton
                      size="sm"
                      onClick={handleSubmitFeedback}
                      className="w-full bg-foreground text-background hover:bg-foreground/90"
                    >
                      Submit Feedback
                    </WidgetButton>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
