import { useState, useMemo } from 'react';
import { PlayIcon } from '@/components/icons/PlayIcon';

// YouTube thumbnail resolutions in priority order (highest to lowest)
const YOUTUBE_THUMBNAILS = ['maxresdefault', 'sddefault', 'hqdefault', 'mqdefault', 'default'];

interface VideoEmbedProps {
  embedUrl: string;
  videoType: string;
  title?: string;
  thumbnail?: string;
  compact?: boolean;
}

export function VideoEmbed({ embedUrl, videoType, title, thumbnail, compact = false }: VideoEmbedProps) {
  const [showPlayer, setShowPlayer] = useState(false);
  const [fallbackIndex, setFallbackIndex] = useState(0);

  // Extract YouTube video ID once
  const youtubeVideoId = useMemo(() => {
    if (videoType === 'youtube') {
      const match = embedUrl.match(/\/embed\/([^?]+)/);
      return match ? match[1] : null;
    }
    return null;
  }, [embedUrl, videoType]);

  // Progressive thumbnail with fallback
  const displayThumbnail = useMemo(() => {
    // If provided thumbnail hasn't failed yet, use it
    if (thumbnail && fallbackIndex === 0) return thumbnail;
    
    // YouTube progressive fallback
    if (youtubeVideoId && fallbackIndex < YOUTUBE_THUMBNAILS.length) {
      return `https://i.ytimg.com/vi/${youtubeVideoId}/${YOUTUBE_THUMBNAILS[fallbackIndex]}.jpg`;
    }
    
    return undefined; // Show placeholder, not broken image
  }, [thumbnail, fallbackIndex, youtubeVideoId]);

  const handleImageError = () => {
    setFallbackIndex(prev => prev + 1);
  };

  // Click-to-play pattern: Show thumbnail with play button first
  if (!showPlayer) {
    return (
      <div 
        onClick={() => setShowPlayer(true)}
        className={`relative cursor-pointer group mt-2 rounded-lg overflow-hidden bg-muted ${compact ? 'aspect-video max-h-32' : 'aspect-video'}`}
      >
        {displayThumbnail ? (
          <img 
            src={displayThumbnail} 
            alt={title || 'Video thumbnail'}
            className="w-full h-full object-cover transition-opacity duration-300"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <span className="text-xs text-muted-foreground capitalize">{videoType} Video</span>
          </div>
        )}
        
        {/* Play button overlay - frosted glass style */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/20 backdrop-blur-md shadow-lg group-hover:bg-white/30 transition-colors">
            <PlayIcon size={32} className="text-white group-hover:text-white/90 transition-colors" />
          </div>
        </div>

        {/* Platform badge */}
        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-2xs font-medium capitalize">
          {videoType}
        </div>
      </div>
    );
  }

  // Render iframe player
  return (
    <div className={`mt-2 rounded-lg overflow-hidden ${compact ? 'aspect-video max-h-48' : 'aspect-video'}`}>
      <iframe
        src={embedUrl}
        title={title || 'Video player'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="w-full h-full border-0"
      />
    </div>
  );
}
