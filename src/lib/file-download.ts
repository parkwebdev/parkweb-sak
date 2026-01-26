import JSZip from 'jszip';
import { logger } from '@/utils/logger';

interface FileToZip {
  url: string;
  fileName: string;
}

/**
 * Downloads a file from a cross-origin URL by fetching it as a blob
 * and triggering a programmatic download.
 * 
 * The HTML5 `download` attribute only works for same-origin URLs,
 * so this function is necessary for Supabase storage files.
 */
export const downloadFile = async (url: string, fileName: string): Promise<void> => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Download failed');
    
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the blob URL
    URL.revokeObjectURL(blobUrl);
  } catch (error: unknown) {
    logger.error('Download failed:', error);
    // Fallback: open in new tab
    window.open(url, '_blank');
  }
};

/**
 * Downloads multiple files and packages them into a single ZIP file.
 * Uses JSZip to create the archive client-side.
 */
export const downloadFilesAsZip = async (
  files: FileToZip[],
  zipFileName: string,
  onProgress?: (completed: number, total: number) => void
): Promise<void> => {
  const zip = new JSZip();
  
  // Fetch all files and add to ZIP
  for (let i = 0; i < files.length; i++) {
    const { url, fileName } = files[i];
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${fileName}`);
      
      const blob = await response.blob();
      zip.file(fileName, blob);
      
      onProgress?.(i + 1, files.length);
    } catch (error: unknown) {
      logger.error(`Failed to add ${fileName} to ZIP:`, error);
      // Continue with other files
    }
  }
  
  // Generate and download ZIP
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const blobUrl = URL.createObjectURL(zipBlob);
  
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = zipFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(blobUrl);
};
