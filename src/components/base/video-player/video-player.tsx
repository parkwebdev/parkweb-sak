/**
 * VideoPlayer Component
 * 
 * A polished native HTML5 video player with thumbnail preview,
 * click-to-play functionality, and clean controls.
 * 
 * Based on UntitledUI design patterns.
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
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
  /** Video title for accessibility */
  title?: string;
}

export function VideoPlayer({
  src,
  thumbnailUrl,
  size = 'md',
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

  const sizeClasses = {
    sm: 'max-w-80',
    md: 'max-w-[35rem]',
    lg: 'max-w-[45rem]',
  };

  const playButtonSizes = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const playIconSizes = {
    sm: 16,
    md: 20,
    lg: 28,
  };

  // Show error if URL is invalid
  if (!isValidUrl && sanitizedSrc) {
    return (
      <div 
        className={cn(
          'relative rounded-lg overflow-hidden bg-destructive/10 flex items-center justify-center',
          sizeClasses[size],
          className
        )}
      >
        <span className="text-sm text-destructive-foreground p-4">Invalid video URL</span>
      </div>
    );
  }

  // Show thumbnail with play button before video starts
  if (!hasStarted) {
    return (
      <div 
        className={cn(
          'relative cursor-pointer group rounded-lg overflow-hidden bg-muted',
          sizeClasses[size],
          className
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
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={`${title} thumbnail`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full aspect-video bg-muted flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Video</span>
          </div>
        )}
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className={cn(
              'flex items-center justify-center rounded-full bg-white/30 backdrop-blur-sm shadow-md group-hover:bg-white/40 transition-colors',
              playButtonSizes[size]
            )}
          >
            <PlayTriangleIcon 
              size={playIconSizes[size]} 
              className="text-white/90" 
            />
          </div>
        </div>
      </div>
    );
  }

  // Show native video player after play is clicked
  return (
    <div 
      className={cn(
        'relative rounded-lg overflow-hidden bg-black',
        sizeClasses[size],
        className
      )}
    >
      {videoError ? (
        <div className="w-full h-full flex items-center justify-center text-destructive-foreground bg-destructive/10 p-4">
          <span className="text-sm">{videoError}</span>
        </div>
      ) : (
        <video
          ref={videoRef}
          src={sanitizedSrc}
          autoPlay
          className="w-full h-full object-contain cursor-pointer"
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
      )}
    </div>
  );
}
