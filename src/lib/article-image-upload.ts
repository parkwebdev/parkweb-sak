/**
 * Article Image Upload Utilities
 * 
 * Handles image optimization and upload for help articles.
 * Provides separate configurations for inline images and featured hero images.
 * 
 * @module lib/article-image-upload
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { optimizeImage } from '@/lib/image-utils';

/**
 * Configuration for inline article image optimization
 * @internal
 */
const IMAGE_CONFIG = {
  /** Maximum width in pixels */
  maxWidth: 800,
  /** Maximum height in pixels */
  maxHeight: 600,
  /** WebP compression quality (0-1) */
  quality: 0.6,
};

/**
 * Configuration for featured/hero image optimization (larger dimensions)
 * @internal
 */
const FEATURED_IMAGE_CONFIG = {
  /** Maximum width in pixels */
  maxWidth: 1200,
  /** Maximum height in pixels */
  maxHeight: 600,
  /** WebP compression quality (0-1) */
  quality: 0.6,
};

/**
 * Uploads an optimized inline image to Supabase storage.
 * Images are resized to max 800x600 and converted to WebP.
 * 
 * @param file - Image file to upload
 * @param userId - User ID for storage path organization
 * @param agentId - Agent ID for storage path organization
 * @returns Promise resolving to the public URL of the uploaded image
 * @throws Error if upload fails
 * 
 * @example
 * const imageUrl = await uploadArticleImage(file, userId, agentId);
 * editor.commands.setImage({ src: imageUrl });
 */
export const uploadArticleImage = async (
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
  const fileName = `${userId}/${agentId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

  const { error } = await supabase.storage
    .from('article-images')
    .upload(fileName, optimizedFile, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    logger.error('Image upload error:', error);
    throw new Error('Failed to upload image');
  }

  const { data: urlData } = supabase.storage
    .from('article-images')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
};

/**
 * Uploads an optimized featured/hero image to Supabase storage.
 * Images are resized to max 1200x600 for hero display.
 * 
 * @param file - Image file to upload
 * @param userId - User ID for storage path organization
 * @param agentId - Agent ID for storage path organization
 * @returns Promise resolving to the public URL of the uploaded image
 * @throws Error if upload fails
 * 
 * @example
 * const heroUrl = await uploadFeaturedImage(file, userId, agentId);
 * setArticle({ ...article, featured_image: heroUrl });
 */
export const uploadFeaturedImage = async (
  file: File,
  userId: string,
  agentId: string
): Promise<string> => {
  const optimizedFile = await optimizeImage(file, {
    maxWidth: FEATURED_IMAGE_CONFIG.maxWidth,
    maxHeight: FEATURED_IMAGE_CONFIG.maxHeight,
    quality: FEATURED_IMAGE_CONFIG.quality,
  });
  
  const fileExt = optimizedFile.name.split('.').pop()?.toLowerCase() || 'webp';
  const fileName = `${userId}/${agentId}/featured-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

  const { error } = await supabase.storage
    .from('article-images')
    .upload(fileName, optimizedFile, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    logger.error('Featured image upload error:', error);
    throw new Error('Failed to upload featured image');
  }

  const { data: urlData } = supabase.storage
    .from('article-images')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
};

/**
 * Deletes an article image from Supabase storage.
 * 
 * @param imageUrl - Public URL of the image to delete
 * 
 * @example
 * await deleteArticleImage(article.featured_image);
 * 
 * @remarks
 * Silently fails if the image path cannot be extracted or deletion fails.
 * This is intentional to prevent blocking article updates.
 */
export const deleteArticleImage = async (imageUrl: string): Promise<void> => {
  // Extract the path from the public URL
  const urlParts = imageUrl.split('/article-images/');
  if (urlParts.length !== 2) return;

  const filePath = urlParts[1];

  const { error } = await supabase.storage
    .from('article-images')
    .remove([filePath]);

  if (error) {
    logger.error('Image delete error:', error);
  }
};
