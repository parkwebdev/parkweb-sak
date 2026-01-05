/**
 * Knowledge Base Screenshot Component
 * 
 * Displays a styled screenshot with optional caption for KB articles.
 * 
 * @module components/knowledge-base/KBScreenshot
 */

import { cn } from '@/lib/utils';

interface KBScreenshotProps {
  /** Image source URL or path */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Optional caption below the image */
  caption?: string;
  /** Optional additional className */
  className?: string;
}

export function KBScreenshot({ src, alt, caption, className }: KBScreenshotProps) {
  return (
    <figure className={cn('my-6', className)}>
      <div className="overflow-hidden rounded-lg border border-border bg-muted/30 shadow-sm">
        <img
          src={src}
          alt={alt}
          className="w-full h-auto"
          loading="lazy"
        />
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-xs text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
