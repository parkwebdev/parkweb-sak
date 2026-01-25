/**
 * Help Center Article View
 * 
 * Main content area for displaying help center articles.
 * Now renders HTML content from the database using HCDatabaseArticleRenderer.
 * 
 * @module components/help-center/HCArticleView
 */

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Clock } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springs } from '@/lib/motion-variants';
import { useTrackArticleView } from '@/hooks/useHCArticleViews';
import { HCArticleFeedback } from './HCArticleFeedback';
import { HCDatabaseArticleRenderer } from './HCDatabaseArticleRenderer';
import { VideoBlockHydrator } from './VideoBlockHydrator';
import { getCategoryColor, getSolidBgClass } from '@/lib/hc-category-colors';
import type { PlatformHCCategory, PlatformHCArticle } from '@/hooks/usePlatformHelpCenter';

interface HCArticleViewProps {
  category: PlatformHCCategory;
  article: PlatformHCArticle;
  onHeadingsChange: (headings: { id: string; text: string; level: number }[]) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  prevArticle?: PlatformHCArticle;
  nextArticle?: PlatformHCArticle;
}

export function HCArticleView({
  category,
  article,
  onHeadingsChange,
  onPrevious,
  onNext,
  prevArticle,
  nextArticle,
}: HCArticleViewProps) {
  const [, setSearchParams] = useSearchParams();
  const contentRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  
  // Track article view
  useTrackArticleView(category.id, article.slug);
  
  // Calculate reading time from content
  const readingTime = Math.max(1, Math.ceil((article.content?.length || 0) / 1500));
  
  // Get color class for this category
  const colorClass = getCategoryColor(category.id, category.color);
  const solidBgClass = getSolidBgClass(colorClass);
  
  // Intercept article link clicks for client-side navigation
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a[data-article-link], [data-related-articles] a');
      
      if (link instanceof HTMLAnchorElement) {
        // Try data attributes first
        const categoryId = link.getAttribute('data-category-id');
        const articleSlug = link.getAttribute('data-article-slug');
        
        if (categoryId && articleSlug) {
          event.preventDefault();
          setSearchParams({ category: categoryId, article: articleSlug });
          return;
        }
        
        // Parse from href as fallback
        const href = link.getAttribute('href');
        const match = href?.match(/[?&]category=([^&]+).*[?&]article=([^&]+)/);
        if (match) {
          event.preventDefault();
          setSearchParams({ category: match[1], article: match[2] });
        }
      }
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [setSearchParams, article.slug]);
  
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
  }, [article.slug, onHeadingsChange]);
  
  // Scroll to top when article changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [article.slug]);

  return (
    <div className="px-8">
      {/* Header with solid background */}
      <header className={cn(
        'py-8 -mx-8 px-8',
        solidBgClass
      )}>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            {article.title}
          </h1>
          {article.description && (
            <p className="text-muted-foreground text-base">
              {article.description}
            </p>
          )}
          
          {/* Reading time badge */}
          {readingTime > 0 && (
            <Badge variant="secondary" className="mt-3 gap-1.5 py-1 bg-foreground text-background dark:bg-background dark:text-foreground border-border/50">
              <Clock size={12} aria-hidden="true" />
              {readingTime} min read
            </Badge>
          )}
        </div>
      </header>
      
      {/* Article Content - rendered from database HTML */}
      <motion.div 
        ref={contentRef}
        className="prose prose-sm dark:prose-invert max-w-none py-8"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springs.smooth}
      >
        <HCDatabaseArticleRenderer content={article.content} />
        <VideoBlockHydrator containerRef={contentRef} contentKey={article.slug} />
      </motion.div>
      
      {/* Article Feedback */}
      <HCArticleFeedback categoryId={category.id} articleSlug={article.slug} />
      
      {/* Navigation */}
      <footer className="mt-4 py-6 border-t border-border no-print" data-print="hide">
        <div className="flex items-center justify-between">
          {onPrevious && prevArticle ? (
            <Button
              variant="ghost"
              onClick={onPrevious}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              aria-keyshortcuts="ArrowLeft k"
            >
              <ChevronLeft size={16} aria-hidden="true" />
              <div className="text-left">
                <div className="text-2xs uppercase tracking-wide text-muted-foreground/60">
                  Previous <span className="hidden sm:inline">(← or K)</span>
                </div>
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
              aria-keyshortcuts="ArrowRight j"
            >
              <div className="text-right">
                <div className="text-2xs uppercase tracking-wide text-muted-foreground/60">
                  Next <span className="hidden sm:inline">(→ or J)</span>
                </div>
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
