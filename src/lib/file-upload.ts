import { supabase } from '@/integrations/supabase/client';

export interface FileUploadResult {
  url: string;
  name: string;
  size: number;
  type: string;
}

export const uploadClientFile = async (
  file: File, 
  userId: string, 
  folder: 'branding' | 'content'
): Promise<FileUploadResult> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${folder}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('client-uploads')
    .upload(filePath, file);

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get the public URL
  const { data: { publicUrl } } = supabase.storage
    .from('client-uploads')
    .getPublicUrl(filePath);

  return {
    url: publicUrl,
    name: file.name,
    size: file.size,
    type: file.type,
  };
};

export const uploadMultipleFiles = async (
  files: FileList,
  userId: string,
  folder: 'branding' | 'content',
  onProgress?: (completed: number, total: number) => void
): Promise<FileUploadResult[]> => {
  const results: FileUploadResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    try {
      const result = await uploadClientFile(files[i], userId, folder);
      results.push(result);
      onProgress?.(i + 1, files.length);
    } catch (error) {
      console.error(`Failed to upload ${files[i].name}:`, error);
      throw error;
    }
  }
  
  return results;
};

export const validateFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png', 
    'image/svg+xml',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not supported. Please upload PDF, DOC, DOCX, JPG, PNG, or SVG files.' };
  }

  return { valid: true };
};