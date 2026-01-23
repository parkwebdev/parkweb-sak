/**
 * Widget-specific LinkPreviews Component
 * 
 * Uses shared useLinkPreviews hook but with widget Supabase client
 * to avoid importing the heavy main app Database types.
 * 
 * @module widget/components/LinkPreviewsWidget
 */

import { useCallback } from 'react';
import { LinkPreviewCard, type LinkPreviewData } from '@/components/chat/LinkPreviewCard';
import { getWidgetSupabase } from '../api';
import { WidgetSkeletonLinkPreview } from '../ui/WidgetSkeleton';
import { useLinkPreviews } from '@/hooks/useLinkPreviews';

interface LinkPreviewsWidgetProps {
  content: string;
  compact?: boolean;
  cachedPreviews?: LinkPreviewData[];
}

export function LinkPreviewsWidget({ content, compact = false, cachedPreviews }: LinkPreviewsWidgetProps) {
  // Fetch function using widget Supabase client
  const fetchPreview = useCallback(async (url: string): Promise<LinkPreviewData | null> => {
    try {
      const { data, error } = await getWidgetSupabase().functions.invoke('fetch-link-preview', {
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

  if (urls.length === 0) return null;

  if (loading) {
    return (
      <div className="space-y-2">
        <WidgetSkeletonLinkPreview />
      </div>
    );
  }

  if (displayPreviews.length === 0) return null;

  if (displayPreviews.length === 1) {
    return <LinkPreviewCard data={displayPreviews[0]} compact={compact} />;
  }

  return (
    <div className="relative">
      <div 
        ref={carouselRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory gap-2 pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {displayPreviews.map((preview, i) => (
          <div key={i} className="snap-center shrink-0 w-full">
            <LinkPreviewCard data={preview} compact={compact} />
          </div>
        ))}
      </div>
      
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
