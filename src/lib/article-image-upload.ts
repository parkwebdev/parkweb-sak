import { supabase } from '@/integrations/supabase/client';

// Configuration for image optimization
const IMAGE_CONFIG = {
  maxWidth: 800,        // Max width in pixels
  maxHeight: 600,       // Max height in pixels  
  quality: 0.85,        // WebP quality (0-1)
};

/**
 * Resize and optimize image before upload
 * - Resizes to max dimensions while maintaining aspect ratio
 * - Converts to WebP for better compression
 * - Returns optimized File object
 */
const optimizeImage = async (file: File): Promise<File> => {
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

export const uploadArticleImage = async (
  file: File,
  userId: string,
  agentId: string
): Promise<string> => {
  // Optimize image before upload
  const optimizedFile = await optimizeImage(file);
  
  const fileExt = optimizedFile.name.split('.').pop()?.toLowerCase() || 'webp';
  const fileName = `${userId}/${agentId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

  const { error } = await supabase.storage
    .from('article-images')
    .upload(fileName, optimizedFile, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Image upload error:', error);
    throw new Error('Failed to upload image');
  }

  const { data: urlData } = supabase.storage
    .from('article-images')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
};

export const deleteArticleImage = async (imageUrl: string): Promise<void> => {
  // Extract the path from the public URL
  const urlParts = imageUrl.split('/article-images/');
  if (urlParts.length !== 2) return;

  const filePath = urlParts[1];

  const { error } = await supabase.storage
    .from('article-images')
    .remove([filePath]);

  if (error) {
    console.error('Image delete error:', error);
  }
};
