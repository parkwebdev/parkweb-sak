/**
 * WidgetFileDropZone Component
 * 
 * Lightweight file drop zone for widget.
 * Replaces @/components/chat/FileDropZone without heavy dependencies.
 * 
 * Key differences from original:
 * - Uses WidgetButton instead of @/components/ui/button
 * - Uses inline error display instead of toast
 * - Uses WidgetFileAttachment instead of FileAttachment
 * 
 * @module widget/components/WidgetFileDropZone
 */

import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { validateFiles } from '@/lib/file-validation';
import { WidgetButton } from '@/widget/ui/WidgetButton';
import { WidgetFileAttachment } from './WidgetFileAttachment';
import { Upload01, XClose } from '@/widget/icons';

/**
 * Props for WidgetFileDropZone
 */
interface WidgetFileDropZoneProps {
  /** Called when files are ready to attach */
  onFilesSelected: (files: File[], fileUrls: string[]) => void;
  /** Called when user cancels file selection */
  onCancel: () => void;
  /** Primary brand color for styling */
  primaryColor: string;
  /** Optional error callback (for parent tracking) */
  onError?: (message: string) => void;
  /** Maximum files allowed (default: 5) */
  maxFiles?: number;
  /** Maximum file size in bytes (default: 10MB) */
  maxSizeBytes?: number;
}

/**
 * File drop zone with drag-and-drop support.
 * Displays inline error messages instead of toast notifications.
 */
export const WidgetFileDropZone: React.FC<WidgetFileDropZoneProps> = ({
  onFilesSelected,
  onCancel,
  primaryColor,
  onError,
  maxFiles = 5,
  maxSizeBytes = 10 * 1024 * 1024,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  }, []);

  const handleFiles = useCallback((files: File[]) => {
    // Clear previous error
    setErrorMessage(null);

    // Validate files using existing validation
    const validation = validateFiles(files);
    
    if (!validation.valid) {
      const msg = validation.error || 'Invalid file';
      setErrorMessage(msg);
      onError?.(msg);
      return;
    }

    // Create object URLs for previews
    const urls = files.map(file => URL.createObjectURL(file));
    setSelectedFiles(files);
    setFileUrls(urls);
  }, [onError]);

  const handleRemoveFile = useCallback((index: number) => {
    // Revoke the URL to prevent memory leaks
    URL.revokeObjectURL(fileUrls[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFileUrls(prev => prev.filter((_, i) => i !== index));
    // Clear error if any
    setErrorMessage(null);
  }, [fileUrls]);

  const handleAddMore = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleSend = useCallback(() => {
    if (selectedFiles.length > 0) {
      onFilesSelected(selectedFiles, fileUrls);
    }
  }, [selectedFiles, fileUrls, onFilesSelected]);

  const handleSelectClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="p-4 bg-background space-y-3">
      {selectedFiles.length === 0 ? (
        // Empty state - drop zone
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-150",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          )}
        >
          <div className="flex flex-col items-center gap-3">
            {/* Upload icon with brand color */}
            <div
              className="p-2 rounded-full"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <Upload01
                className="h-5 w-5"
                style={{ color: primaryColor }}
              />
            </div>
            
            {/* Instructions */}
            <div>
              <p className="text-sm font-medium">
                Drag and drop files here
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Max {maxFiles} files, {Math.round(maxSizeBytes / 1024 / 1024)}MB each
              </p>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.csv,.ppt,.pptx"
              onChange={handleFileInput}
              className="hidden"
              aria-label="Select files to upload"
            />

            {/* Select button */}
            <WidgetButton
              onClick={handleSelectClick}
              style={{ backgroundColor: primaryColor }}
              className="text-white"
            >
              Select Files
            </WidgetButton>
          </div>

          {/* Inline error display (replaces toast) */}
          {errorMessage && (
            <div className="text-xs text-destructive mt-3" role="alert">
              {errorMessage}
            </div>
          )}
        </div>
      ) : (
        // Files selected state - show file list
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
            </p>
            <WidgetButton
              size="sm"
              variant="ghost"
              onClick={handleAddMore}
            >
              Add more
            </WidgetButton>
            {/* Hidden file input for "Add more" */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.csv,.ppt,.pptx"
              onChange={handleFileInput}
              className="hidden"
              aria-label="Add more files"
            />
          </div>
          
          {/* File grid - 2 columns with scroll */}
          <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <WidgetFileAttachment
                key={`${file.name}-${index}`}
                file={file}
                fileUrl={fileUrls[index]}
                onRemove={() => handleRemoveFile(index)}
                primaryColor={primaryColor}
              />
            ))}
          </div>

          {/* Inline error display */}
          {errorMessage && (
            <div className="text-xs text-destructive" role="alert">
              {errorMessage}
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <WidgetButton
          variant="outline"
          className="flex-1"
          onClick={onCancel}
        >
          <XClose className="h-4 w-4 mr-2" />
          Cancel
        </WidgetButton>
        {selectedFiles.length > 0 && (
          <WidgetButton
            className="flex-1 text-white"
            onClick={handleSend}
            style={{ backgroundColor: primaryColor }}
          >
            Attach {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
          </WidgetButton>
        )}
      </div>
    </div>
  );
};
