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

import { useState, useRef, useCallback } from 'react';
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
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = useCallback(() => {
    setHasStarted(true);
    setIsPlaying(true);
    // Small delay to ensure video element is mounted
    setTimeout(() => {
      videoRef.current?.play();
    }, 50);
  }, []);

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

  const sizeClasses = {
    sm: 'max-w-80',
    md: 'max-w-[35rem]',
    lg: 'max-w-[45rem]',
  };

  const playButtonSizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  };

  const playIconSizes = {
    sm: 20,
    md: 28,
    lg: 32,
  };

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
              'flex items-center justify-center rounded-full bg-white/50 backdrop-blur-sm shadow-md group-hover:bg-white/60 transition-colors',
              playButtonSizes[size]
            )}
          >
            <PlayTriangleIcon 
              size={playIconSizes[size]} 
              className="text-white/80 ml-1" 
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
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain cursor-pointer"
        controls
        controlsList="nodownload"
        playsInline
        onClick={handleVideoClick}
        onEnded={handleVideoEnded}
        title={title}
      >
        <track kind="captions" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
