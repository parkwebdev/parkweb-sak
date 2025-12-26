/**
 * WidgetFileAttachment Components
 * 
 * Lightweight file attachment components for widget.
 * Replaces @/components/chat/FileAttachment without heavy dependencies.
 * 
 * Exports:
 * - WidgetFileAttachment: For file selection preview with remove button
 * - WidgetMessageFileAttachment: For displaying files in messages with download
 * 
 * @module widget/components/WidgetFileAttachment
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { isImageFile, formatFileSize } from '@/lib/file-validation';
import { downloadFile } from '@/lib/file-download';
import { FileTypeIcon } from '@/components/chat/FileTypeIcons';
import { X, Download01 } from '@/widget/icons';

/**
 * Props for WidgetFileAttachment (file selection preview)
 */
interface WidgetFileAttachmentProps {
  file: File;
  fileUrl: string;
  onRemove: () => void;
  primaryColor: string;
}

/**
 * File attachment preview for file selection UI.
 * Shows image thumbnail or file icon with remove button.
 */
export function WidgetFileAttachment({
  file,
  fileUrl,
  onRemove,
  primaryColor,
}: WidgetFileAttachmentProps) {
  const isImage = isImageFile(file.type);

  return (
    <div className="relative group">
      {isImage ? (
        // Image preview layout - 128x128 with filename overlay
        <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border">
          <img
            src={fileUrl}
            alt={file.name}
            className="w-full h-full object-cover"
          />
          {/* Remove button - top-right, shows on hover */}
          <button
            type="button"
            onClick={onRemove}
            className={cn(
              "absolute top-1 right-1 h-6 w-6 p-0",
              "flex items-center justify-center",
              "rounded-md bg-destructive text-destructive-foreground",
              "opacity-0 group-hover:opacity-100 transition-opacity duration-150",
              "hover:bg-destructive/90",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:opacity-100"
            )}
            aria-label={`Remove ${file.name}`}
          >
            <X className="h-3 w-3" />
          </button>
          {/* Filename overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-1 text-xs truncate">
            {file.name}
          </div>
        </div>
      ) : (
        // Non-image file layout - horizontal with icon, name, size, remove
        <div className="relative flex items-center gap-3 p-3 border border-border rounded-lg bg-background">
          <FileTypeIcon fileName={file.name} width={40} height={40} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.size)}
            </p>
          </div>
          {/* Remove button - inline for non-images */}
          <button
            type="button"
            onClick={onRemove}
            className={cn(
              "h-6 w-6 p-0 shrink-0",
              "flex items-center justify-center",
              "rounded-md text-muted-foreground",
              "hover:bg-accent hover:text-accent-foreground",
              "transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
            aria-label={`Remove ${file.name}`}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Props for WidgetMessageFileAttachment (message display)
 */
interface WidgetMessageFileAttachmentProps {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  primaryColor: string;
}

/**
 * File attachment display for chat messages.
 * Shows file with download button instead of remove.
 */
export function WidgetMessageFileAttachment({
  fileName,
  fileUrl,
  fileType,
  fileSize,
  primaryColor,
}: WidgetMessageFileAttachmentProps) {
  const isImage = isImageFile(fileType);

  const handleDownload = () => {
    downloadFile(fileUrl, fileName);
  };

  if (isImage) {
    return (
      <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-background/50 max-w-[280px]">
        <a 
          href={fileUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="shrink-0"
        >
          <img 
            src={fileUrl} 
            alt={fileName} 
            className="w-12 h-12 object-cover rounded-md" 
          />
        </a>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{fileName}</p>
          {fileSize && (
            <p className="text-xs text-muted-foreground">{formatFileSize(fileSize)}</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleDownload}
          className={cn(
            "p-1.5 rounded-md shrink-0",
            "text-muted-foreground",
            "hover:bg-accent transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
          title="Download"
          aria-label={`Download ${fileName}`}
        >
          <Download01 size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-background/50 max-w-[280px]">
      <FileTypeIcon fileName={fileName} width={40} height={40} className="shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{fileName}</p>
        {fileSize && (
          <p className="text-xs text-muted-foreground">
            {formatFileSize(fileSize)}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={handleDownload}
        className={cn(
          "p-1.5 rounded-md shrink-0",
          "text-muted-foreground",
          "hover:bg-accent transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
        title="Download"
        aria-label={`Download ${fileName}`}
      >
        <Download01 size={18} />
      </button>
    </div>
  );
};
