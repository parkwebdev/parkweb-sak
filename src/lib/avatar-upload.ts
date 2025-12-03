import { supabase } from '@/integrations/supabase/client';

const AVATAR_CONFIG = {
  maxSize: 256,
  quality: 0.65,
};

export const optimizeAvatar = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      
      const { width, height } = img;
      
      // Center-crop to square
      const size = Math.min(width, height);
      const cropX = (width - size) / 2;
      const cropY = (height - size) / 2;
      
      // Output is always 256x256 square
      canvas.width = AVATAR_CONFIG.maxSize;
      canvas.height = AVATAR_CONFIG.maxSize;
      
      // Draw center-cropped square, scaled to 256x256
      ctx?.drawImage(
        img,
        cropX, cropY, size, size,
        0, 0, AVATAR_CONFIG.maxSize, AVATAR_CONFIG.maxSize
      );
      
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
            resolve(file);
          }
        },
        'image/webp',
        AVATAR_CONFIG.quality
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

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
