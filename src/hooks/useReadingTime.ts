/**
 * Reading Time Hook
 * 
 * Calculates estimated reading time from rendered article content.
 * Uses standard reading speed of ~200 words per minute.
 * 
 * @module hooks/useReadingTime
 */

import { useState, useEffect, type RefObject } from 'react';

const WORDS_PER_MINUTE = 200;

/**
 * Calculate reading time from a content element
 * @param contentRef - Ref to the content container element
 * @returns Estimated reading time in minutes (minimum 1)
 */
export function useReadingTime(contentRef: RefObject<HTMLElement | null>): number {
  const [readingTime, setReadingTime] = useState<number>(0);

  useEffect(() => {
    const calculateReadingTime = () => {
      if (!contentRef.current) return;

      const text = contentRef.current.textContent || '';
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
      
      setReadingTime(minutes);
    };

    // Delay to ensure content is rendered
    const timer = setTimeout(calculateReadingTime, 150);
    return () => clearTimeout(timer);
  }, [contentRef]);

  return readingTime;
}
