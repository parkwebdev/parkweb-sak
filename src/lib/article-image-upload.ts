import { supabase } from '@/integrations/supabase/client';

export const uploadArticleImage = async (
  file: File,
  userId: string,
  agentId: string
): Promise<string> => {
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
  const fileName = `${userId}/${agentId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

  const { error } = await supabase.storage
    .from('article-images')
    .upload(fileName, file, {
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
