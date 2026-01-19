/**
 * VideoPlayer Component
 * 
 * Industry-standard video player with fixed 16:9 aspect ratio container,
 * thumbnail preview, and clean controls.
 * 
 * Follows YouTube/Vimeo/Notion pattern:
 * - Fixed aspect ratio container (always stable sizing)
 * - Poster frame or placeholder before play
 * - Video letterboxed if non-16:9 source
 * 
 * @module components/base/video-player/video-player
 */

import { useState, useRef, useCallback, type SyntheticEvent } from 'react';
import { PlayTriangleIcon } from '@/components/icons/PlayTriangleIcon';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  /** Video source URL (self-hosted .mp4) */
  src: string;
  /** Thumbnail image URL */
  thumbnailUrl?: string;
  /** Additional className for container */
  className?: string;
  /** Video title for accessibility */
  title?: string;
}

export function VideoPlayer({
  src,
  thumbnailUrl,
  className,
  title = 'Video player',
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sanitize and validate the URL
  const sanitizedSrc = src?.trim() || '';
  const isValidUrl = (() => {
    if (!sanitizedSrc) return false;
    try {
      const url = new URL(sanitizedSrc);
      return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
      return false;
    }
  })();

  const handlePlay = useCallback(() => {
    if (!isValidUrl) {
      setVideoError('Invalid video URL');
      return;
    }
    setHasStarted(true);
    setIsPlaying(true);
  }, [isValidUrl]);

  const handleVideoClick = useCallback(() => {
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleVideoError = useCallback((e: SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const error = video.error;
    console.error('Video load error:', error?.code, error?.message, src);
    setVideoError(error?.message || 'Failed to load video');
  }, [src]);

  // Base container classes - video uses 16:9, thumbnail hugs content
  const baseContainerClasses = cn(
    'relative w-full max-w-3xl rounded-lg overflow-hidden',
    className
  );

  // Show error state
  if (videoError || (!isValidUrl && sanitizedSrc)) {
    return (
      <div className={cn(baseContainerClasses, 'aspect-video bg-destructive/10 flex items-center justify-center')}>
        <span className="text-sm text-destructive-foreground">
          {videoError || 'Invalid video URL'}
        </span>
      </div>
    );
  }

  // Show thumbnail/placeholder with play button before video starts
  if (!hasStarted) {
    return (
      <div 
        className={cn(
          baseContainerClasses, 
          // Hug thumbnail height if provided, otherwise use 16:9
          thumbnailUrl ? 'bg-black' : 'aspect-video bg-muted',
          'cursor-pointer group'
        )}
        onClick={handlePlay}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handlePlay();
          }
        }}
        aria-label={`Play ${title}`}
      >
        {/* Thumbnail determines container height when provided */}
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={`${title} thumbnail`}
            className="w-full h-auto block"
          />
        ) : null}
        
        {/* Play button overlay - always centered */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center justify-center rounded-full bg-white/30 backdrop-blur-sm shadow-md group-hover:bg-white/40 transition-colors w-16 h-16">
            <PlayTriangleIcon 
              size={28} 
              className="text-white" 
            />
          </div>
        </div>
      </div>
    );
  }

  // Show native video player after play is clicked - always 16:9 for video
  return (
    <div className={cn(baseContainerClasses, 'aspect-video bg-black')}>
      <video
        ref={videoRef}
        src={sanitizedSrc}
        poster={thumbnailUrl || undefined}
        autoPlay
        className="absolute inset-0 w-full h-full object-contain cursor-pointer"
        controls
        controlsList="nodownload"
        playsInline
        onClick={handleVideoClick}
        onEnded={handleVideoEnded}
        onError={handleVideoError}
        title={title}
      >
        <track kind="captions" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
