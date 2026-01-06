/**
 * OptimizedImage Component
 * 
 * Image component with built-in performance optimizations:
 * - Lazy loading by default (loading="lazy")
 * - Async decoding (decoding="async")
 * - Priority loading option for above-the-fold images
 * 
 * @module components/ui/optimized-image
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Image source URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** 
   * Set to true for above-the-fold images that should load immediately.
   * When true, sets loading="eager" and fetchPriority="high".
   * @default false
   */
  priority?: boolean;
}

/**
 * Optimized image component with lazy loading and async decoding.
 * 
 * @example
 * ```tsx
 * // Regular image (lazy loaded)
 * <OptimizedImage src="/image.jpg" alt="Description" />
 * 
 * // Priority image (above-the-fold)
 * <OptimizedImage src="/hero.jpg" alt="Hero" priority />
 * ```
 */
export function OptimizedImage({ 
  src, 
  alt, 
  priority = false, 
  className,
  ...props 
}: OptimizedImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      className={cn(className)}
      {...props}
    />
  );
}

export default OptimizedImage;
