import { useState, useEffect, useRef, useCallback } from 'react';
import { LinkPreviewCard, LinkPreviewData } from './LinkPreviewCard';
import { supabase } from '@/integrations/supabase/client';

// URL regex that matches http/https URLs
const URL_REGEX = /https?:\/\/[^\s<>"')\]]+/gi;

// Simple in-memory cache for link previews
const previewCache = new Map<string, LinkPreviewData | null>();

interface LinkPreviewsProps {
  content: string;
  compact?: boolean;
  cachedPreviews?: LinkPreviewData[]; // Server-side cached previews from message metadata
}

export function LinkPreviews({ content, compact = false, cachedPreviews }: LinkPreviewsProps) {
  const [previews, setPreviews] = useState<(LinkPreviewData | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const fetchedRef = useRef(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Extract unique URLs from content
  const urls = Array.from(new Set(content.match(URL_REGEX) || [])).slice(0, 5); // Max 5 previews

  // Get valid previews from cached or fetched data
  const getValidPreviews = useCallback((previewList: (LinkPreviewData | null)[]): LinkPreviewData[] => {
    return previewList.filter((p): p is LinkPreviewData => p !== null && (!!p.title || !!p.videoType));
  }, []);

  // Handle scroll to update current index
  const handleScroll = useCallback(() => {
    if (!carouselRef.current) return;
    const scrollLeft = carouselRef.current.scrollLeft;
    const cardWidth = carouselRef.current.offsetWidth;
    const newIndex = Math.round(scrollLeft / cardWidth);
    setCurrentIndex(newIndex);
  }, []);

  // Scroll to specific index
  const scrollToIndex = useCallback((index: number) => {
    if (!carouselRef.current) return;
    const cardWidth = carouselRef.current.offsetWidth;
    carouselRef.current.scrollTo({
      left: cardWidth * index,
      behavior: 'smooth'
    });
    setCurrentIndex(index);
  }, []);

  // If we have cached previews from server, use them directly
  const validCached = cachedPreviews ? getValidPreviews(cachedPreviews) : [];
  
  useEffect(() => {
    // Skip client-side fetching if we have cached previews
    if (cachedPreviews && cachedPreviews.length > 0) return;
    if (urls.length === 0 || fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchPreviews = async () => {
      setLoading(true);
      
      const results = await Promise.all(
        urls.map(async (url) => {
          // Check cache first
          if (previewCache.has(url)) {
            return previewCache.get(url) || null;
          }

          try {
            const { data, error } = await supabase.functions.invoke('fetch-link-preview', {
              body: { url }
            });

            if (error || !data || data.error) {
              previewCache.set(url, null);
              return null;
            }

            previewCache.set(url, data);
            return data as LinkPreviewData;
          } catch {
            previewCache.set(url, null);
            return null;
          }
        })
      );

      setPreviews(results);
      setLoading(false);
    };

    fetchPreviews();
  }, [content, cachedPreviews]);

  // Don't render anything if no URLs or all failed
  if (urls.length === 0) return null;

  // Use cached previews if available, otherwise use fetched previews
  const displayPreviews = validCached.length > 0 ? validCached : getValidPreviews(previews);
  
  if (loading) {
    return (
      <div className="space-y-2">
        <div className="rounded-lg border border-border bg-muted/30 p-3 animate-pulse">
          <div className="h-3 bg-muted rounded w-24 mb-2" />
          <div className="h-4 bg-muted rounded w-3/4 mb-1" />
          <div className="h-3 bg-muted rounded w-full" />
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