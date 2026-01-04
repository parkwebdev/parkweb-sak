/**
 * Avatar Upload Utilities
 * 
 * Handles user avatar optimization and upload to Supabase storage.
 * Avatars are center-cropped to square, resized to 256x256, and converted to WebP.
 * 
 * @module lib/avatar-upload
 */

import { supabase } from '@/integrations/supabase/client';
import { optimizeImage } from '@/lib/image-utils';

/**
 * Configuration for avatar image optimization
 * @internal
 */
const AVATAR_CONFIG = {
  /** Output size in pixels (square) */
  maxSize: 256,
  /** WebP compression quality (0-1) */
  quality: 0.65,
};

/**
 * Optimizes an avatar image by center-cropping to square and resizing.
 * Converts to WebP format for optimal file size.
 * 
 * @param file - Original image file from user input
 * @returns Promise resolving to optimized File object
 * @throws Error if image fails to load
 * 
 * @example
 * const optimized = await optimizeAvatar(rawFile);
 * console.log(optimized.size); // Much smaller than original
 * 
 * @remarks
 * - Input images are center-cropped to preserve the most important area
 * - Output is always 256x256 pixels in WebP format
 * - Reduces typical avatar sizes from 1-5MB to 10-40KB
 */
export const optimizeAvatar = async (file: File): Promise<File> => {
  return optimizeImage(file, {
    maxWidth: AVATAR_CONFIG.maxSize,
    maxHeight: AVATAR_CONFIG.maxSize,
    quality: AVATAR_CONFIG.quality,
    cropToSquare: true,
  });
};

/**
 * Uploads an optimized avatar to Supabase storage and returns the public URL.
 * 
 * @param file - Image file to upload
 * @param userId - User ID for organizing storage path
 * @returns Promise resolving to the public URL of the uploaded avatar
 * @throws Error if upload fails
 * 
 * @example
 * const avatarUrl = await uploadAvatar(selectedFile, user.id);
 * await updateProfile({ avatar_url: avatarUrl });
 * 
 * @remarks
 * - File is automatically optimized before upload
 * - Stored in 'avatars' bucket under user-specific folder
 * - URL includes timestamp to prevent caching issues
 */
export const uploadAvatar = async (file: File, userId: string): Promise<string> => {
  const optimizedFile = await optimizeAvatar(file);
  
  const timestamp = Date.now();
  const fileName = `${userId}/${userId}-${timestamp}.webp`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(fileName, optimizedFile, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw new Error(error.message || 'Failed to upload avatar');

  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
};
