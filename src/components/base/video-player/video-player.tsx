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
import { PlayIcon } from '@/components/icons/PlayIcon';
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
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
  };

  const playIconSizes = {
    sm: 24,
    md: 32,
    lg: 36,
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
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
          <div 
            className={cn(
              'flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md shadow-lg group-hover:bg-white/30 transition-colors',
              playButtonSizes[size]
            )}
          >
            <PlayIcon 
              size={playIconSizes[size]} 
              className="text-white group-hover:text-white/90 transition-colors" 
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
