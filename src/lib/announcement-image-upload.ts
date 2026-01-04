/**
 * Announcement Image Upload Utilities
 * 
 * Handles image optimization and upload for announcements.
 * 
 * @module lib/announcement-image-upload
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { optimizeImage } from '@/lib/image-utils';

/**
 * Configuration for announcement image optimization
 * @internal
 */
const IMAGE_CONFIG = {
  /** Maximum width in pixels */
  maxWidth: 400,
  /** Maximum height in pixels */
  maxHeight: 400,
  /** WebP compression quality (0-1) */
  quality: 0.6,
};

/**
 * Uploads an optimized announcement image to Supabase storage.
 * Images are resized to max 400x400 and converted to WebP.
 * 
 * @param file - Image file to upload
 * @param userId - User ID for storage path organization
 * @param agentId - Agent ID for storage path organization
 * @returns Promise resolving to the public URL of the uploaded image
 * @throws Error if upload fails
 */
export const uploadAnnouncementImage = async (
  file: File,
  userId: string,
  agentId: string
): Promise<string> => {
  // Optimize image before upload
  const optimizedFile = await optimizeImage(file, {
    maxWidth: IMAGE_CONFIG.maxWidth,
    maxHeight: IMAGE_CONFIG.maxHeight,
    quality: IMAGE_CONFIG.quality,
  });
  
  const fileExt = optimizedFile.name.split('.').pop()?.toLowerCase() || 'webp';
  const fileName = `${userId}/${agentId}/announcements/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

  const { error } = await supabase.storage
    .from('article-images')
    .upload(fileName, optimizedFile, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    logger.error('Announcement image upload error:', error);
    throw new Error('Failed to upload image');
  }

  const { data: urlData } = supabase.storage
    .from('article-images')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
};

/**
 * Deletes an announcement image from Supabase storage.
 * 
 * @param imageUrl - Public URL of the image to delete
 */
export const deleteAnnouncementImage = async (imageUrl: string): Promise<void> => {
  // Extract the path from the public URL
  const urlParts = imageUrl.split('/article-images/');
  if (urlParts.length !== 2) return;

  const filePath = urlParts[1];

  const { error } = await supabase.storage
    .from('article-images')
    .remove([filePath]);

  if (error) {
    logger.error('Announcement image delete error:', error);
  }
};
