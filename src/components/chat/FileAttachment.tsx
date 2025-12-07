import React from 'react';
import { X, Download01 } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { isImageFile, formatFileSize } from '@/lib/file-validation';
import { FileTypeIcon } from './FileTypeIcons';

interface FileAttachmentProps {
  file: File;
  fileUrl: string;
  onRemove: () => void;
  primaryColor: string;
}

export const FileAttachment: React.FC<FileAttachmentProps> = ({
  file,
  fileUrl,
  onRemove,
  primaryColor,
}) => {
  const isImage = isImageFile(file.type);

  return (
    <div className="relative group">
      {isImage ? (
        <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
          <img
            src={fileUrl}
            alt={file.name}
            className="w-full h-full object-cover"
          />
          <Button
            size="sm"
            variant="destructive"
            className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onRemove}
          >
            <X className="h-3 w-3" />
          </Button>
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-1 text-xs truncate">
            {file.name}
          </div>
        </div>
      ) : (
        <div className="relative flex items-center gap-3 p-3 border rounded-lg bg-background">
          <FileTypeIcon fileName={file.name} width={40} height={40} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.size)}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={onRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};

interface MessageFileAttachmentProps {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  primaryColor: string;
}

export const MessageFileAttachment: React.FC<MessageFileAttachmentProps> = ({
  fileName,
  fileUrl,
  fileType,
  fileSize,
  primaryColor,
}) => {
  const isImage = isImageFile(fileType);

  if (isImage) {
    return (
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block max-w-[280px] rounded-lg overflow-hidden border"
      >
        <img
          src={fileUrl}
          alt={fileName}
          className="w-full h-auto"
        />
        <div className="bg-muted/50 px-2 py-1 text-xs truncate">
          {fileName}
        </div>
      </a>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg bg-background/50 max-w-[280px]">
      <FileTypeIcon fileName={fileName} width={40} height={40} className="shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{fileName}</p>
        {fileSize && (
          <p className="text-xs text-muted-foreground">
            {formatFileSize(fileSize)}
          </p>
        )}
      </div>
      <a
        href={fileUrl}
        download={fileName}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 rounded-md hover:bg-accent transition-colors shrink-0"
        title="Download"
      >
        <Download01 size={18} className="text-muted-foreground" />
      </a>
    </div>
  );
};
