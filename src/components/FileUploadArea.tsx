import React, { useState } from 'react';
import { UploadCloud01, X, File05 as FileText, ImageX as Image } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { validateFile, FileUploadResult } from '@/lib/file-upload';
import { toast } from '@/hooks/use-toast';

interface FileUploadAreaProps {
  onFilesSelected: (files: FileList) => void;
  uploadedFiles: FileUploadResult[];
  onRemoveFile: (index: number) => void;
  uploading: boolean;
  uploadProgress: number;
  accept?: string;
  multiple?: boolean;
  title: string;
  description: string;
}

export const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  onFilesSelected,
  uploadedFiles,
  onRemoveFile,
  uploading,
  uploadProgress,
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.svg",
  multiple = true,
  title,
  description
}) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    // Validate files before uploading
    const validFiles: File[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateFile(file);
      
      if (validation.valid) {
        validFiles.push(file);
      } else {
        toast({
          title: "Invalid file",
          description: `${file.name}: ${validation.error}`,
          variant: "destructive",
        });
      }
    }

    if (validFiles.length > 0) {
      // Create FileList from valid files
      const dt = new DataTransfer();
      validFiles.forEach(file => dt.items.add(file));
      onFilesSelected(dt.files);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="h-4 w-4 text-blue-500" />;
    }
    return <FileText className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <UploadCloud01 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {description}
          </p>
          
          <div className="space-y-2">
            <input
              type="file"
              id={`file-upload-${title.replace(/\s+/g, '-').toLowerCase()}`}
              className="hidden"
              multiple={multiple}
              accept={accept}
              onChange={handleChange}
              disabled={uploading}
            />
            <label 
              htmlFor={`file-upload-${title.replace(/\s+/g, '-').toLowerCase()}`}
              className="cursor-pointer"
            >
              <Button
                type="button"
                variant="outline"
                className="pointer-events-none"
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Choose Files'}
              </Button>
            </label>
            <p className="text-xs text-gray-400">
              PDF, DOC, DOCX, JPG, PNG, SVG up to 10MB
            </p>
          </div>
        </div>
      </div>

      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading files...</span>
            <span>{uploadProgress}%</span>
          </div>
          <ProgressBar value={uploadProgress} className="w-full" />
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files:</h4>
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded border"
            >
              <div className="flex items-center gap-2">
                {getFileIcon(file.type)}
                <div>
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({formatFileSize(file.size)})
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemoveFile(index)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};