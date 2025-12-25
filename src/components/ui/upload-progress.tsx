/**
 * Upload Progress Component
 * 
 * Consistent upload progress indicator for file uploads.
 * Uses a spinner with text for action feedback.
 * 
 * @module components/ui/upload-progress
 */

import { cn } from '@/lib/utils';

interface UploadProgressProps {
  /** Text to display below the spinner */
  text?: string;
  /** Additional className */
  className?: string;
}

export function UploadProgress({ text = 'Uploading...', className }: UploadProgressProps) {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent mb-2" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
