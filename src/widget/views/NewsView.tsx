/**
 * NewsView Component
 * 
 * News/announcements view with article cards and detail view.
 * Supports featured images, author info, and CTA buttons.
 * DOMPurify is lazy-loaded to reduce initial bundle size.
 * 
 * @module widget/views/NewsView
 */

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from '@untitledui/icons';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { CSSAnimatedList } from '../CSSAnimatedList';
import { CSSAnimatedItem } from '../CSSAnimatedItem';
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

const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'span', 'div', 'img'];
const ALLOWED_ATTR = ['href', 'target', 'rel', 'class', 'src', 'alt', 'width', 'height', 'style'];

interface NewsItem {
  id: string;
  title: string;
  body: string;
  featured_image_url?: string;
  author_name?: string;
  author_avatar?: string;
  published_at?: string;
  cta_primary_label?: string;
  cta_primary_url?: string;
  cta_secondary_label?: string;
  cta_secondary_url?: string;
}

interface NewsViewProps {
  config: WidgetConfig;
  newsItems: NewsItem[];
}

export const NewsView = ({ config, newsItems }: NewsViewProps) => {
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [sanitizedContent, setSanitizedContent] = useState<string>('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // Lazy-load and sanitize article content
  useEffect(() => {
    if (!selectedArticle) {
      setSanitizedContent('');
      return;
    }
    
    setIsLoadingContent(true);
    loadDOMPurify().then(purify => {
      const clean = purify.sanitize(selectedArticle.body, {
        ALLOWED_TAGS,
        ALLOWED_ATTR,
      });
      setSanitizedContent(clean);
      setIsLoadingContent(false);
    });
  }, [selectedArticle]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  // Calculate previous/next articles
  const currentIndex = selectedArticle 
    ? newsItems.findIndex(item => item.id === selectedArticle.id) 
    : -1;
  const previousArticle = currentIndex > 0 ? newsItems[currentIndex - 1] : null;
  const nextArticle = currentIndex < newsItems.length - 1 ? newsItems[currentIndex + 1] : null;

  // Article detail view
  if (selectedArticle) {
    return (
      <div className="flex flex-col h-full animate-fade-in">
        {/* Back header */}
        <div className="flex items-center gap-2 py-2.5 px-4 border-b bg-muted/50">
          <button
            onClick={() => setSelectedArticle(null)}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="font-medium text-sm">Back to News</span>
        </div>

        {/* Article content */}
        <div className="flex-1 overflow-y-auto">
          {selectedArticle.featured_image_url && (
            <img
              src={selectedArticle.featured_image_url}
              alt={selectedArticle.title}
              className="w-full h-48 object-cover"
            />
          )}
          
          <div className="p-4 space-y-4">
            <h2 className="text-xl font-semibold">{selectedArticle.title}</h2>
            
            {/* Author and date */}
            {(selectedArticle.author_name || selectedArticle.published_at) && (
              <div className="flex items-center gap-3">
                {selectedArticle.author_avatar && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedArticle.author_avatar} />
                    <AvatarFallback className="text-xs">
                      {selectedArticle.author_name?.[0] || 'A'}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="flex flex-col">
                  {selectedArticle.author_name && (
                    <span className="text-sm font-medium">{selectedArticle.author_name}</span>
                  )}
                  {selectedArticle.published_at && (
                    <span className="text-xs text-muted-foreground">
                      {formatDate(selectedArticle.published_at)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Article body */}
            {isLoadingContent ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-5/6" />
              </div>
            ) : (
              <div 
                className="article-content max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizedContent }}
              />
            )}

            {/* CTA Buttons */}
            {((selectedArticle.cta_primary_label && selectedArticle.cta_primary_url) || 
              (selectedArticle.cta_secondary_label && selectedArticle.cta_secondary_url)) && (
              <div className="flex gap-2 pt-4">
                {selectedArticle.cta_primary_label && selectedArticle.cta_primary_url && (
                  <a
                    href={selectedArticle.cta_primary_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {selectedArticle.cta_primary_label}
                  </a>
                )}
                {selectedArticle.cta_secondary_label && selectedArticle.cta_secondary_url && (
                  <a
                    href={selectedArticle.cta_secondary_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                  >
                    {selectedArticle.cta_secondary_label}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Previous/Next Navigation */}
        {(previousArticle || nextArticle) && (
          <div className="flex items-center justify-between py-2 px-4 border-t bg-background">
            {previousArticle ? (
              <button
                onClick={() => setSelectedArticle(previousArticle)}
                className="group inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                <span>Previous</span>
              </button>
            ) : (
              <div />
            )}
            
            {nextArticle ? (
              <button
                onClick={() => setSelectedArticle(nextArticle)}
                className="group inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="h-3 w-3 opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
              </button>
            ) : (
              <div />
            )}
          </div>
        )}
      </div>
    );
  }

  // News list view
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {newsItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <p className="text-muted-foreground text-sm">No news articles yet</p>
          </div>
        ) : (
          <CSSAnimatedList className="space-y-4">
            {newsItems.map((item) => (
              <CSSAnimatedItem key={item.id}>
                <button
                  onClick={() => setSelectedArticle(item)}
                  className="w-full text-left bg-card border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                >
                  {item.featured_image_url && (
                    <img
                      src={item.featured_image_url}
                      alt={item.title}
                      className="w-full h-32 object-cover"
                    />
                  )}
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-sm line-clamp-2">{item.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {stripHtml(item.body)}
                    </p>
                    
                    {/* Author and date row */}
                    <div className="flex items-center gap-2 pt-2">
                      {item.author_avatar && (
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={item.author_avatar} />
                          <AvatarFallback className="text-2xs">
                            {item.author_name?.[0] || 'A'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {item.author_name}
                        {item.author_name && item.published_at && ' • '}
                        {formatDate(item.published_at)}
                      </span>
                    </div>
                  </div>
                </button>
              </CSSAnimatedItem>
            ))}
          </CSSAnimatedList>
        )}
      </div>
    </div>
  );
};
