/**
 * Widget-specific LinkPreviews Component
 * 
 * Identical to main app LinkPreviews but uses widgetSupabase
 * to avoid importing the heavy main app Database types.
 * 
 * @module widget/components/LinkPreviewsWidget
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { LinkPreviewCard, LinkPreviewData } from '@/components/chat/LinkPreviewCard';
import { widgetSupabase } from '../api';

// URL regex that matches http/https URLs
const URL_REGEX = /https?:\/\/[^\s<>"')\]]+/gi;

// Simple in-memory cache for link previews
const previewCache = new Map<string, LinkPreviewData | null>();

interface LinkPreviewsWidgetProps {
  content: string;
  compact?: boolean;
  cachedPreviews?: LinkPreviewData[];
}

export function LinkPreviewsWidget({ content, compact = false, cachedPreviews }: LinkPreviewsWidgetProps) {
  const [previews, setPreviews] = useState<(LinkPreviewData | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const fetchedRef = useRef(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const urls = Array.from(new Set(content.match(URL_REGEX) || [])).slice(0, 5);

  const getValidPreviews = useCallback((previewList: (LinkPreviewData | null)[]): LinkPreviewData[] => {
    return previewList.filter((p): p is LinkPreviewData => p !== null && (!!p.title || !!p.videoType));
  }, []);

  const handleScroll = useCallback(() => {
    if (!carouselRef.current) return;
    const scrollLeft = carouselRef.current.scrollLeft;
    const cardWidth = carouselRef.current.offsetWidth;
    const newIndex = Math.round(scrollLeft / cardWidth);
    setCurrentIndex(newIndex);
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    if (!carouselRef.current) return;
    const cardWidth = carouselRef.current.offsetWidth;
    carouselRef.current.scrollTo({
      left: cardWidth * index,
      behavior: 'smooth'
    });
    setCurrentIndex(index);
  }, []);

  const validCached = cachedPreviews ? getValidPreviews(cachedPreviews) : [];
  
  useEffect(() => {
    if (cachedPreviews && cachedPreviews.length > 0) return;
    if (urls.length === 0 || fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchPreviews = async () => {
      setLoading(true);
      
      const results = await Promise.all(
        urls.map(async (url) => {
          if (previewCache.has(url)) {
            return previewCache.get(url) || null;
          }

          try {
            const { data, error } = await widgetSupabase.functions.invoke('fetch-link-preview', {
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

  if (urls.length === 0) return null;

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
