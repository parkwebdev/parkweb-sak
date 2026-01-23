/**
 * Link Previews Component
 * 
 * Extracts URLs from content and displays rich link preview cards.
 * Uses shared useLinkPreviews hook for logic.
 * 
 * @module components/chat/LinkPreviews
 */

import { useCallback } from 'react';
import { LinkPreviewCard, type LinkPreviewData } from './LinkPreviewCard';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useLinkPreviews } from '@/hooks/useLinkPreviews';

interface LinkPreviewsProps {
  content: string;
  compact?: boolean;
  cachedPreviews?: LinkPreviewData[];
}

export function LinkPreviews({ content, compact = false, cachedPreviews }: LinkPreviewsProps) {
  // Fetch function using main app Supabase client
  const fetchPreview = useCallback(async (url: string): Promise<LinkPreviewData | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-link-preview', {
        body: { url }
      });

      if (error || !data || data.error) {
        return null;
      }

      return data as LinkPreviewData;
    } catch {
      return null;
    }
  }, []);

  const {
    urls,
    displayPreviews,
    loading,
    currentIndex,
    carouselRef,
    handleScroll,
    scrollToIndex,
  } = useLinkPreviews({
    content,
    cachedPreviews,
    fetchPreview,
  });

  // Don't render anything if no URLs
  if (urls.length === 0) return null;

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-4 w-3/4 mb-1" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
    );
  }

  if (displayPreviews.length === 0) return null;

  // Single preview: show as-is without carousel
  if (displayPreviews.length === 1) {
    return <LinkPreviewCard data={displayPreviews[0]} compact={compact} />;
  }

  // Multiple previews: carousel mode
  return (
    <div
      className="relative w-full max-w-full min-w-0 overflow-hidden"
      style={{ contain: 'inline-size' }}
    >
      {/* Carousel container with scroll snap */}
      <div
        ref={carouselRef}
        onScroll={handleScroll}
        className="flex w-full max-w-full min-w-0 overflow-x-auto snap-x snap-mandatory gap-2 pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {displayPreviews.map((preview, i) => (
          <div key={i} className="snap-center flex-none min-w-full">
            <LinkPreviewCard data={preview} compact={compact} />
          </div>
        ))}
      </div>

      {/* Pagination dots */}
      <div className="flex justify-center gap-1.5 mt-2">
        {displayPreviews.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToIndex(i)}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              i === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
            aria-label={`Go to preview ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}