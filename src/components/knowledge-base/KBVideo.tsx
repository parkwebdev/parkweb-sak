/**
 * Knowledge Base Video Component
 * 
 * Embeds a video player for tutorial content.
 * 
 * @module components/knowledge-base/KBVideo
 */

import { cn } from '@/lib/utils';

interface KBVideoProps {
  /** Video source URL */
  src: string;
  /** Video title for accessibility */
  title: string;
  /** Optional poster image */
  poster?: string;
  /** Optional caption below the video */
  caption?: string;
  /** Optional additional className */
  className?: string;
}

export function KBVideo({ src, title, poster, caption, className }: KBVideoProps) {
  // Check if it's a YouTube embed
  const isYouTube = src.includes('youtube.com') || src.includes('youtu.be');
  
  if (isYouTube) {
    // Convert YouTube URL to embed format
    const videoId = src.includes('youtu.be') 
      ? src.split('/').pop()?.split('?')[0]
      : new URLSearchParams(new URL(src).search).get('v');
    
    return (
      <figure className={cn('my-6', className)}>
        <div className="aspect-video overflow-hidden rounded-lg border border-border shadow-sm">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
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
  
  return (
    <figure className={cn('my-6', className)}>
      <div className="aspect-video overflow-hidden rounded-lg border border-border shadow-sm">
        <video
          src={src}
          title={title}
          poster={poster}
          controls
          preload="metadata"
          className="h-full w-full"
        >
          <track kind="captions" />
          Your browser does not support the video tag.
        </video>
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-xs text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
