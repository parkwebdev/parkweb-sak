/**
 * Announcement Image Upload Utilities
 * 
 * Handles image optimization and upload for announcements.
 * 
 * @module lib/announcement-image-upload
 */

import { supabase } from '@/integrations/supabase/client';

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
 * Optimizes an announcement image by resizing and converting to WebP.
 * Maintains aspect ratio while fitting within max dimensions.
 * 
 * @param file - Original image file
 * @returns Promise resolving to optimized File object
 * @throws Error if image fails to load
 * @internal
 */
const optimizeAnnouncementImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      
      let { width, height } = img;
      
      // Calculate new dimensions maintaining aspect ratio
      if (width > IMAGE_CONFIG.maxWidth) {
        height = (height * IMAGE_CONFIG.maxWidth) / width;
        width = IMAGE_CONFIG.maxWidth;
      }
      if (height > IMAGE_CONFIG.maxHeight) {
        width = (width * IMAGE_CONFIG.maxHeight) / height;
        height = IMAGE_CONFIG.maxHeight;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Convert to WebP
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const optimizedFile = new File(
              [blob], 
              file.name.replace(/\.[^/.]+$/, '.webp'),
              { type: 'image/webp' }
            );
            resolve(optimizedFile);
          } else {
            // Fallback: return original file if conversion fails
            resolve(file);
          }
        },
        'image/webp',
        IMAGE_CONFIG.quality
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
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
  const optimizedFile = await optimizeAnnouncementImage(file);
  
  const fileExt = optimizedFile.name.split('.').pop()?.toLowerCase() || 'webp';
  const fileName = `${userId}/${agentId}/announcements/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

  const { error } = await supabase.storage
    .from('article-images')
    .upload(fileName, optimizedFile, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Announcement image upload error:', error);
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
    console.error('Announcement image delete error:', error);
  }
};
