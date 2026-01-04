/**
 * Unified Image Optimization Utilities
 * 
 * Provides a single, configurable image optimization function for all upload needs.
 * Supports square cropping (for avatars), aspect ratio preservation, and WebP conversion.
 * 
 * @module lib/image-utils
 */

/**
 * Configuration options for image optimization
 */
export interface ImageOptimizeOptions {
  /** Maximum width in pixels */
  maxWidth: number;
  /** Maximum height in pixels */
  maxHeight: number;
  /** WebP compression quality (0-1). Default: 0.6 */
  quality?: number;
  /** Center-crop to square (for avatars). Default: false */
  cropToSquare?: boolean;
}

/**
 * Optimizes an image by resizing and converting to WebP format.
 * 
 * Supports two modes:
 * - **Crop to square**: Center-crops the image to a square, then resizes to maxWidth x maxWidth.
 *   Ideal for avatars. Set `cropToSquare: true`.
 * - **Preserve aspect ratio**: Resizes to fit within maxWidth x maxHeight while maintaining proportions.
 *   Ideal for article images, announcements, etc.
 * 
 * @param file - Original image file from user input
 * @param options - Optimization configuration
 * @returns Promise resolving to optimized File object in WebP format
 * @throws Error if image fails to load
 * 
 * @example
 * // Avatar (square crop)
 * const avatar = await optimizeImage(file, { maxWidth: 256, maxHeight: 256, quality: 0.65, cropToSquare: true });
 * 
 * // Article image (preserve aspect ratio)
 * const articleImg = await optimizeImage(file, { maxWidth: 800, maxHeight: 600, quality: 0.6 });
 * 
 * // Featured image (larger dimensions)
 * const heroImg = await optimizeImage(file, { maxWidth: 1200, maxHeight: 600, quality: 0.6 });
 */
export async function optimizeImage(file: File, options: ImageOptimizeOptions): Promise<File> {
  const { maxWidth, maxHeight, quality = 0.6, cropToSquare = false } = options;

  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      URL.revokeObjectURL(img.src);

      const { width, height } = img;

      if (cropToSquare) {
        // Center-crop to square, then resize to maxWidth x maxWidth
        const size = Math.min(width, height);
        const cropX = (width - size) / 2;
        const cropY = (height - size) / 2;

        canvas.width = maxWidth;
        canvas.height = maxWidth;

        ctx?.drawImage(
          img,
          cropX, cropY, size, size,
          0, 0, maxWidth, maxWidth
        );
      } else {
        // Preserve aspect ratio, fit within bounds
        let newWidth = width;
        let newHeight = height;

        if (newWidth > maxWidth) {
          newHeight = (newHeight * maxWidth) / newWidth;
          newWidth = maxWidth;
        }
        if (newHeight > maxHeight) {
          newWidth = (newWidth * maxHeight) / newHeight;
          newHeight = maxHeight;
        }

        canvas.width = newWidth;
        canvas.height = newHeight;

        ctx?.drawImage(img, 0, 0, newWidth, newHeight);
      }

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
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}
