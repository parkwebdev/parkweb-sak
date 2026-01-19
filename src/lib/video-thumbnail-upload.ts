/**
 * Video Thumbnail Upload Utilities
 * 
 * Handles image optimization and upload for video thumbnails in help articles.
 * Uses the "Help Articles" Supabase storage bucket.
 * 
 * @module lib/video-thumbnail-upload
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { optimizeImage } from '@/lib/image-utils';

/**
 * Configuration for video thumbnail optimization
 * Uses 16:9 aspect ratio standard for video thumbnails
 * @internal
 */
const THUMBNAIL_CONFIG = {
  /** Maximum width in pixels (16:9 aspect ratio) */
  maxWidth: 1280,
  /** Maximum height in pixels (16:9 aspect ratio) */
  maxHeight: 720,
  /** WebP compression quality (0-1) */
  quality: 0.8,
};

/**
 * Uploads an optimized video thumbnail to Supabase storage.
 * Images are resized to max 1280x720 (16:9) and converted to WebP.
 * 
 * @param file - Image file to upload
 * @param userId - User ID for storage path organization
 * @returns Promise resolving to the public URL of the uploaded thumbnail
 * @throws Error if upload fails
 * 
 * @example
 * const thumbnailUrl = await uploadVideoThumbnail(file, userId);
 * editor.commands.setVideo({ src: videoUrl, thumbnail: thumbnailUrl });
 */
export async function uploadVideoThumbnail(
  file: File,
  userId: string
): Promise<string> {
  // Optimize image before upload
  const optimizedFile = await optimizeImage(file, {
    maxWidth: THUMBNAIL_CONFIG.maxWidth,
    maxHeight: THUMBNAIL_CONFIG.maxHeight,
    quality: THUMBNAIL_CONFIG.quality,
  });
  
  const fileExt = optimizedFile.name.split('.').pop()?.toLowerCase() || 'webp';
  const fileName = `${userId}/video-thumbnails/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

  const { error } = await supabase.storage
    .from('Help Articles')
    .upload(fileName, optimizedFile, {
      cacheControl: '31536000', // 1 year cache for thumbnails
      upsert: false,
    });

  if (error) {
    logger.error('Video thumbnail upload error:', error);
    throw new Error('Failed to upload video thumbnail');
  }

  const { data: urlData } = supabase.storage
    .from('Help Articles')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

/**
 * Deletes a video thumbnail from Supabase storage.
 * 
 * @param thumbnailUrl - Public URL of the thumbnail to delete
 * 
 * @example
 * await deleteVideoThumbnail(videoNode.attrs.thumbnail);
 * 
 * @remarks
 * Silently fails if the path cannot be extracted or deletion fails.
 * This is intentional to prevent blocking video updates.
 */
export async function deleteVideoThumbnail(thumbnailUrl: string): Promise<void> {
  if (!thumbnailUrl) return;
  
  // Extract the path from the public URL
  // URL format: .../Help%20Articles/userId/video-thumbnails/filename.webp
  const urlParts = thumbnailUrl.split('/Help%20Articles/');
  if (urlParts.length !== 2) return;

  const filePath = decodeURIComponent(urlParts[1]);

  const { error } = await supabase.storage
    .from('Help Articles')
    .remove([filePath]);

  if (error) {
    logger.error('Video thumbnail delete error:', error);
  }
}
