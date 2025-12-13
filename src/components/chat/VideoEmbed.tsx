import { useState } from 'react';
import { PlayCircle } from '@untitledui/icons';

interface VideoEmbedProps {
  embedUrl: string;
  videoType: string;
  title?: string;
  thumbnail?: string;
  compact?: boolean;
}

export function VideoEmbed({ embedUrl, videoType, title, thumbnail, compact = false }: VideoEmbedProps) {
  const [showPlayer, setShowPlayer] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);

  // Generate platform-specific thumbnail if not provided
  const getThumbnail = (): string | undefined => {
    if (thumbnail && !thumbnailError) return thumbnail;
    
    // Extract video ID from embed URL for fallback thumbnails
    if (videoType === 'youtube') {
      const match = embedUrl.match(/\/embed\/([^?]+)/);
      if (match) {
        return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
      }
    }
    
    return undefined;
  };

  const displayThumbnail = getThumbnail();

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
            onError={() => setThumbnailError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <span className="text-xs text-muted-foreground capitalize">{videoType} Video</span>
          </div>
        )}
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
          <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
            <PlayCircle className="w-8 h-8 text-primary-foreground" />
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
