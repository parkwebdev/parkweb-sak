/**
 * File Validation Utilities
 * 
 * Provides validation for file uploads including size limits, type checking,
 * and batch validation. Used across file upload components.
 * 
 * @module lib/file-validation
 */

/** Maximum allowed file size in bytes (10MB) */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Allowed image MIME types for upload */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

/** Allowed document MIME types for upload */
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
];

/** Combined list of all allowed file MIME types */
export const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
];

/**
 * Result of file validation check
 */
export interface FileValidationResult {
  /** Whether the file passed validation */
  valid: boolean;
  /** Error message if validation failed */
  error?: string;
}

/**
 * Validates a single file against size, type, and name constraints.
 * 
 * @param file - The File object to validate
 * @returns Validation result with valid flag and optional error message
 * 
 * @example
 * const result = validateFile(uploadedFile);
 * if (!result.valid) {
 *   showError(result.error);
 * }
 */
export const validateFile = (file: File): FileValidationResult => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${Math.floor(MAX_FILE_SIZE / 1024 / 1024)}MB`,
    };
  }

  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'File type not supported. Please upload images (JPG, PNG, GIF, WebP) or documents (PDF, DOC, DOCX, XLS, XLSX, CSV, PPT, PPTX, TXT)',
    };
  }

  // Validate file name length
  if (file.name.length > 255) {
    return {
      valid: false,
      error: 'File name is too long',
    };
  }

  return { valid: true };
};

/**
 * Validates an array of files for batch upload.
 * Checks batch size limit and validates each file individually.
 * 
 * @param files - Array of File objects to validate
 * @returns Validation result for the entire batch
 * 
 * @example
 * const result = validateFiles(selectedFiles);
 * if (!result.valid) {
 *   toast.error(result.error);
 *   return;
 * }
 * // Proceed with upload
 */
export const validateFiles = (files: File[]): FileValidationResult => {
  // Maximum 5 files at once
  if (files.length > 5) {
    return {
      valid: false,
      error: 'You can only upload up to 5 files at once',
    };
  }

  // Validate each file
  for (const file of files) {
    const result = validateFile(file);
    if (!result.valid) {
      return result;
    }
  }

  return { valid: true };
};

/**
 * Checks if a file type is an image based on MIME type.
 * 
 * @param fileType - MIME type string to check
 * @returns True if the file type is an allowed image type
 * 
 * @example
 * if (isImageFile(file.type)) {
 *   showImagePreview(file);
 * }
 */
export const isImageFile = (fileType: string): boolean => {
  return ALLOWED_IMAGE_TYPES.includes(fileType);
};

/**
 * Formats a byte size into a human-readable string.
 * 
 * @param bytes - Size in bytes
 * @returns Formatted string with appropriate unit (Bytes, KB, or MB)
 * 
 * @example
 * formatFileSize(1024)
 * // => '1 KB'
 * 
 * @example
 * formatFileSize(1536000)
 * // => '1.46 MB'
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
