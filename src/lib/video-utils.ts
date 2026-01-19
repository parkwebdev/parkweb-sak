/**
 * Video URL utilities for detecting video types and generating embed URLs.
 * Supports YouTube, Vimeo, Loom, Wistia, and self-hosted videos (AWS S3/CloudFront).
 * 
 * @module lib/video-utils
 */

export type VideoType = 'youtube' | 'vimeo' | 'loom' | 'wistia' | 'self-hosted';

/**
 * Detect video type from URL
 */
export function detectVideoType(url: string): VideoType {
  const normalized = url.toLowerCase();
  
  if (/youtube\.com|youtu\.be/.test(normalized)) return 'youtube';
  if (/vimeo\.com/.test(normalized)) return 'vimeo';
  if (/loom\.com/.test(normalized)) return 'loom';
  if (/wistia\./.test(normalized)) return 'wistia';
  
  return 'self-hosted';
}

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYouTubeId(url: string): string | null {
  // Match youtube.com/watch?v=ID
  const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
  if (watchMatch) return watchMatch[1];
  
  // Match youtu.be/ID
  const shortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (shortMatch) return shortMatch[1];
  
  // Match youtube.com/embed/ID
  const embedMatch = url.match(/youtube\.com\/embed\/([^?]+)/);
  if (embedMatch) return embedMatch[1];
  
  return null;
}

/**
 * Extract Vimeo video ID
 */
export function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Extract Loom video ID
 */
export function extractLoomId(url: string): string | null {
  const match = url.match(/loom\.com\/share\/([^?]+)/);
  return match ? match[1] : null;
}

/**
 * Extract Wistia video ID
 */
export function extractWistiaId(url: string): string | null {
  // Match wistia.com/medias/ID or fast.wistia.net/embed/iframe/ID
  const mediaMatch = url.match(/wistia\.com\/medias\/([^?]+)/);
  if (mediaMatch) return mediaMatch[1];
  
  const embedMatch = url.match(/wistia\.net\/embed\/iframe\/([^?]+)/);
  return embedMatch ? embedMatch[1] : null;
}

/**
 * Convert a video URL to its embed-ready format
 */
export function getEmbedUrl(url: string, type: VideoType): string {
  switch (type) {
    case 'youtube': {
      const id = extractYouTubeId(url);
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }
    case 'vimeo': {
      const id = extractVimeoId(url);
      return id ? `https://player.vimeo.com/video/${id}` : url;
    }
    case 'loom': {
      const id = extractLoomId(url);
      return id ? `https://www.loom.com/embed/${id}` : url;
    }
    case 'wistia': {
      const id = extractWistiaId(url);
      return id ? `https://fast.wistia.net/embed/iframe/${id}` : url;
    }
    case 'self-hosted':
    default:
      return url;
  }
}

/**
 * Get YouTube thumbnail URL
 */
export function getYouTubeThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
}

/**
 * Check if a URL is a valid video URL (either embed or self-hosted)
 */
export function isValidVideoUrl(url: string): boolean {
  if (!url) return false;
  
  // Check for known video platforms
  if (/youtube\.com|youtu\.be|vimeo\.com|loom\.com|wistia\./.test(url.toLowerCase())) {
    return true;
  }
  
  // Check for common video file extensions
  if (/\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url)) {
    return true;
  }
  
  // Check for common CDN patterns (AWS, CloudFront, etc.)
  if (/cloudfront\.net|s3\.amazonaws\.com|s3-[\w-]+\.amazonaws\.com/i.test(url)) {
    return true;
  }
  
  return false;
}

/**
 * Check if a URL is a valid self-hosted video URL (direct video files only)
 */
export function isValidSelfHostedVideoUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const parsed = new URL(url);
    const isHttps = parsed.protocol === 'https:';
    const hasVideoExtension = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(parsed.pathname);
    const isCdnUrl = /cloudfront\.net|s3\.amazonaws\.com|s3-[\w-]+\.amazonaws\.com/i.test(parsed.hostname);
    
    // Accept HTTPS URLs that either have video extension or are from known CDNs
    return isHttps && (hasVideoExtension || isCdnUrl);
  } catch {
    return false;
  }
}
