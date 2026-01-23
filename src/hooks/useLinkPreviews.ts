/**
 * Shared Link Previews Hook
 * 
 * Extracts URLs from content, fetches previews, and manages carousel state.
 * Used by both main app LinkPreviews and widget LinkPreviewsWidget.
 * 
 * @module hooks/useLinkPreviews
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { LinkPreviewData } from '@/components/chat/LinkPreviewCard';

// URL regex that matches http/https URLs
const URL_REGEX = /https?:\/\/[^\s<>"')\]]+/gi;

// Simple in-memory cache for link previews
const previewCache = new Map<string, LinkPreviewData | null>();

export interface UseLinkPreviewsOptions {
  /** Message content to extract URLs from */
  content: string;
  /** Server-side cached previews from message metadata */
  cachedPreviews?: LinkPreviewData[];
  /** Function to fetch a preview for a URL */
  fetchPreview: (url: string) => Promise<LinkPreviewData | null>;
}

export interface UseLinkPreviewsResult {
  /** URLs extracted from content */
  urls: string[];
  /** Valid previews to display (cached or fetched) */
  displayPreviews: LinkPreviewData[];
  /** Whether previews are currently being fetched */
  loading: boolean;
  /** Current carousel index */
  currentIndex: number;
  /** Ref for the carousel container */
  carouselRef: React.RefObject<HTMLDivElement>;
  /** Handler for carousel scroll events */
  handleScroll: () => void;
  /** Function to scroll to a specific index */
  scrollToIndex: (index: number) => void;
}

/**
 * Hook for managing link preview fetching and carousel state.
 * Shared between main app and widget to avoid code duplication.
 */
export function useLinkPreviews({
  content,
  cachedPreviews,
  fetchPreview,
}: UseLinkPreviewsOptions): UseLinkPreviewsResult {
  const [previews, setPreviews] = useState<(LinkPreviewData | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const fetchedRef = useRef(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Extract unique URLs from content (max 5)
  const urls = Array.from(new Set(content.match(URL_REGEX) || [])).slice(0, 5);

  // Filter valid previews (has title or is video)
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

  // Get valid cached previews
  const validCached = cachedPreviews ? getValidPreviews(cachedPreviews) : [];

  // Fetch previews if not cached
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
            const data = await fetchPreview(url);
            previewCache.set(url, data);
            return data;
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
  }, [content, cachedPreviews, urls, fetchPreview]);

  // Use cached previews if available, otherwise use fetched previews
  const displayPreviews = validCached.length > 0 ? validCached : getValidPreviews(previews);

  return {
    urls,
    displayPreviews,
    loading,
    currentIndex,
    carouselRef,
    handleScroll,
    scrollToIndex,
  };
}
