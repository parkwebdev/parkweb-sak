/**
 * VideoPlayer Component
 * 
 * Industry-standard video player with fixed 16:9 aspect ratio container,
 * thumbnail preview, smooth play transition, and clean controls.
 * 
 * Follows YouTube/Vimeo/Notion pattern:
 * - Fixed aspect ratio container (always stable sizing)
 * - Poster frame or placeholder before play
 * - Smooth crossfade transition on play
 * - Video letterboxed if non-16:9 source
 * 
 * @module components/base/video-player/video-player
 */

import { useState, useRef, useCallback, type SyntheticEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayTriangleIcon } from '@/components/icons/PlayTriangleIcon';
import { useReducedMotion } from '@/hooks/useReducedMotion';
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
  const prefersReducedMotion = useReducedMotion();

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

  // Animation configuration
  const transitionDuration = prefersReducedMotion ? 0 : 0.35;
  
  const thumbnailVariants = {
    visible: { opacity: 1, scale: 1 },
    exit: { 
      opacity: 0, 
      scale: prefersReducedMotion ? 1 : 1.02,
      transition: { duration: transitionDuration, ease: 'easeOut' as const }
    }
  };
  
  const videoVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { duration: transitionDuration, ease: 'easeIn' as const }
    }
  };

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

  // Standard container classes - 16:9 aspect ratio, reasonable max-width
  const containerClasses = cn(
    'relative w-full max-w-3xl aspect-video rounded-lg overflow-hidden',
    className
  );

  // Show error state
  if (videoError || (!isValidUrl && sanitizedSrc)) {
    return (
      <div className={cn(containerClasses, 'bg-destructive/10 flex items-center justify-center')}>
        <span className="text-sm text-destructive-foreground">
          {videoError || 'Invalid video URL'}
        </span>
      </div>
    );
  }

  return (
    <div className={cn(containerClasses, 'bg-black')}>
      <AnimatePresence mode="wait">
        {!hasStarted ? (
          // Thumbnail state with play button
          <motion.div 
            key="thumbnail"
            variants={thumbnailVariants}
            initial="visible"
            exit="exit"
            className="absolute inset-0 bg-muted cursor-pointer group"
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
            {/* Thumbnail fills container if provided */}
            {thumbnailUrl && (
              <img 
                src={thumbnailUrl} 
                alt={`${title} thumbnail`}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            
            {/* Play button overlay - always centered */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div 
                className="flex items-center justify-center rounded-full bg-white/30 backdrop-blur-sm shadow-md group-hover:bg-white/40 transition-colors w-16 h-16"
                whileTap={prefersReducedMotion ? undefined : { scale: 0.9 }}
                transition={{ duration: 0.1 }}
              >
                <PlayTriangleIcon 
                  size={28} 
                  className="text-white" 
                />
              </motion.div>
            </div>
          </motion.div>
        ) : (
          // Video player state
          <motion.div
            key="video"
            variants={videoVariants}
            initial="hidden"
            animate="visible"
            className="absolute inset-0"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
