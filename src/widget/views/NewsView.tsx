import { useState } from 'react';
import { ChevronLeft } from '@untitledui/icons';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { CSSAnimatedList } from '../CSSAnimatedList';
import { CSSAnimatedItem } from '../CSSAnimatedItem';
import type { WidgetConfig } from '../api';
import DOMPurify from 'isomorphic-dompurify';

interface NewsItem {
  id: string;
  title: string;
  body: string;
  featured_image_url?: string;
  author_name?: string;
  author_avatar?: string;
  published_at?: string;
}

interface NewsViewProps {
  config: WidgetConfig;
  newsItems: NewsItem[];
}

export const NewsView = ({ config, newsItems }: NewsViewProps) => {
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);

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

  // Sanitize HTML for safe rendering
  const sanitizeHtml = (html: string) => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'span', 'div', 'img'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'src', 'alt', 'width', 'height', 'style'],
    });
  };

  // Article detail view
  if (selectedArticle) {
    return (
      <div className="flex flex-col h-full">
        {/* Back header */}
        <div className="flex items-center gap-2 p-4 border-b">
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
            <h1 className="text-xl font-semibold">{selectedArticle.title}</h1>
            
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
            <div 
              className="article-content max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedArticle.body) }}
            />
          </div>
        </div>
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
                          <AvatarFallback className="text-[10px]">
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
