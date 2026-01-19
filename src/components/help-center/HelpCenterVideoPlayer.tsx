/**
 * HelpCenterVideoPlayer Component
 * 
 * Wrapper for VideoPlayer specifically for Help Center articles.
 * Uses self-hosted videos from AWS S3/CloudFront.
 * 
 * @module components/help-center/HelpCenterVideoPlayer
 */

import { VideoPlayer } from '@/components/base/video-player/video-player';

interface HelpCenterVideoPlayerProps {
  /** Video source URL (AWS S3/CloudFront) */
  src: string;
  /** Thumbnail image URL */
  thumbnail?: string;
  /** Video title for accessibility */
  title?: string;
}

export function HelpCenterVideoPlayer({ src, thumbnail, title }: HelpCenterVideoPlayerProps) {
  return (
    <VideoPlayer
      size="lg"
      src={src?.trim() || ''}
      thumbnailUrl={thumbnail?.trim()}
      title={title?.trim()}
      className="aspect-video w-full overflow-hidden rounded-lg"
    />
  );
}
