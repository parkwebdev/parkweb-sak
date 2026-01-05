/**
 * Knowledge Base Article View
 * 
 * Main content area for displaying knowledge base articles.
 * Renders the article component and provides navigation.
 * 
 * @module components/knowledge-base/KBArticleView
 */

import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { KBCategory, KBArticle } from '@/config/knowledge-base-config';

interface KBArticleViewProps {
  category: KBCategory;
  article: KBArticle;
  onHeadingsChange: (headings: { id: string; text: string; level: number }[]) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  prevArticle?: KBArticle;
  nextArticle?: KBArticle;
}

export function KBArticleView({
  category,
  article,
  onHeadingsChange,
  onPrevious,
  onNext,
  prevArticle,
  nextArticle,
}: KBArticleViewProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const ArticleComponent = article.component;
  
  // Extract headings from content for ToC
  useEffect(() => {
    const extractHeadings = () => {
      if (!contentRef.current) return;
      
      const headingElements = contentRef.current.querySelectorAll('h2, h3');
      const headings = Array.from(headingElements).map((el, index) => {
        // Ensure heading has an ID for scroll targeting
        if (!el.id) {
          el.id = `heading-${index}`;
        }
        return {
          id: el.id,
          text: el.textContent || '',
          level: parseInt(el.tagName.charAt(1)),
        };
      });
      
      onHeadingsChange(headings);
    };
    
    // Small delay to ensure content is rendered
    const timer = setTimeout(extractHeadings, 100);
    return () => clearTimeout(timer);
  }, [article.id, onHeadingsChange]);
  
  // Scroll to top when article changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [article.id]);

  return (
    <div className="max-w-3xl mx-auto px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4" aria-label="Breadcrumb">
        <span className={cn('w-2 h-2 rounded-full', category.color)} aria-hidden="true" />
        <span>{category.label}</span>
        <span aria-hidden="true">/</span>
        <span className="text-foreground font-medium">{article.title}</span>
      </nav>
      
      {/* Header */}
      <header className="mb-8">
        <Badge variant="secondary" className="mb-3">
          {category.label}
        </Badge>
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          {article.title}
        </h1>
        {article.description && (
          <p className="text-muted-foreground text-base">
            {article.description}
          </p>
        )}
      </header>
      
      {/* Article Content */}
      <div 
        ref={contentRef}
        className="prose prose-sm dark:prose-invert max-w-none kb-article-content"
      >
        <ArticleComponent />
      </div>
      
      {/* Navigation */}
      <footer className="mt-12 pt-6 border-t border-border">
        <div className="flex items-center justify-between">
          {onPrevious && prevArticle ? (
            <Button
              variant="ghost"
              onClick={onPrevious}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft size={16} aria-hidden="true" />
              <div className="text-left">
                <div className="text-2xs uppercase tracking-wide text-muted-foreground/60">Previous</div>
                <div className="text-sm font-medium">{prevArticle.title}</div>
              </div>
            </Button>
          ) : (
            <div />
          )}
          
          {onNext && nextArticle ? (
            <Button
              variant="ghost"
              onClick={onNext}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <div className="text-right">
                <div className="text-2xs uppercase tracking-wide text-muted-foreground/60">Next</div>
                <div className="text-sm font-medium">{nextArticle.title}</div>
              </div>
              <ChevronRight size={16} aria-hidden="true" />
            </Button>
          ) : (
            <div />
          )}
        </div>
      </footer>
    </div>
  );
}
