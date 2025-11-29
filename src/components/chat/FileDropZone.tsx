import React, { useState, useRef } from 'react';
import { Upload01, XClose } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { validateFiles } from '@/lib/file-validation';
import { FileAttachment } from './FileAttachment';
import { useToast } from '@/hooks/use-toast';

interface FileDropZoneProps {
  onFilesSelected: (files: File[], fileUrls: string[]) => void;
  onCancel: () => void;
  primaryColor: string;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  onFilesSelected,
  onCancel,
  primaryColor,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    const validation = validateFiles(files);
    
    if (!validation.valid) {
      toast({
        title: 'Invalid file',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }

    const urls = files.map(file => URL.createObjectURL(file));
    setSelectedFiles(files);
    setFileUrls(urls);
  };

  const handleRemoveFile = (index: number) => {
    URL.revokeObjectURL(fileUrls[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFileUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (selectedFiles.length > 0) {
      onFilesSelected(selectedFiles, fileUrls);
    }
  };

  return (
    <div className="p-4 border-t bg-background space-y-3">
      {selectedFiles.length === 0 ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
        >
          <div className="flex flex-col items-center gap-3">
            <div
              className="p-3 rounded-full"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <Upload01
                className="h-6 w-6"
                style={{ color: primaryColor }}
              />
            </div>
            <div>
              <p className="text-sm font-medium">
                Drag and drop files here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Max 5 files, 10MB each
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileInput}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              style={{ backgroundColor: primaryColor }}
              className="text-white"
            >
              Select Files
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
            </p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
            >
              Add more
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <FileAttachment
                key={index}
                file={file}
                fileUrl={fileUrls[index]}
                onRemove={() => handleRemoveFile(index)}
                primaryColor={primaryColor}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onCancel}
        >
          <XClose className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        {selectedFiles.length > 0 && (
          <Button
            className="flex-1"
            onClick={handleSend}
            style={{ backgroundColor: primaryColor }}
          >
            Send {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
          </Button>
        )}
      </div>
    </div>
  );
};
