/**
 * Video Input Dialog
 * 
 * Dialog for entering video URLs when adding/editing videos in the article editor.
 * Supports self-hosted video files with optional thumbnail upload.
 */

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isValidSelfHostedVideoUrl } from '@/lib/video-utils';
import { uploadVideoThumbnail, deleteVideoThumbnail } from '@/lib/video-thumbnail-upload';
import { AlertCircle, Upload01, Trash01, Image01 } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
import { getErrorMessage } from '@/types/errors';

interface VideoInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (url: string, thumbnailUrl?: string) => void;
  initialUrl?: string;
  initialThumbnail?: string;
  userId: string;
}

export function VideoInputDialog({
  open,
  onOpenChange,
  onSubmit,
  initialUrl = '',
  initialThumbnail = '',
  userId,
}: VideoInputDialogProps) {
  const [url, setUrl] = useState(initialUrl || '');
  const [error, setError] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState(initialThumbnail || '');
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setUrl(initialUrl || '');
      setThumbnailUrl(initialThumbnail || '');
      setError(null);
    }
  }, [open, initialUrl, initialThumbnail]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('Please enter a video URL');
      return;
    }

    if (!isValidSelfHostedVideoUrl(url)) {
      setError('Please enter a valid video URL (.mp4, .webm, .ogg, or .mov from your CDN)');
      return;
    }

    onSubmit(url, thumbnailUrl || undefined);
    onOpenChange(false);
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (error) setError(null);
  };

  const handleThumbnailUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    try {
      setThumbnailUploading(true);
      setError(null);
      
      // Delete old thumbnail if replacing
      if (thumbnailUrl) {
        await deleteVideoThumbnail(thumbnailUrl);
      }
      
      const uploadedUrl = await uploadVideoThumbnail(file, userId);
      setThumbnailUrl(uploadedUrl);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setThumbnailUploading(false);
    }
  };

  const handleRemoveThumbnail = async () => {
    if (thumbnailUrl) {
      await deleteVideoThumbnail(thumbnailUrl);
      setThumbnailUrl('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleThumbnailUpload(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

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
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleThumbnailUpload(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialUrl ? 'Edit Video' : 'Insert Video'}</DialogTitle>
          <DialogDescription>
            Enter the URL of a self-hosted video file (e.g., AWS S3/CloudFront .mp4).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Video URL input */}
            <div className="space-y-2">
              <Label htmlFor="video-url">Video URL</Label>
              <Input
                id="video-url"
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://cdn.example.com/videos/tutorial.mp4"
                autoFocus
                error={!!error && !error.includes('image')}
              />
            </div>

            {/* Thumbnail upload */}
            <div className="space-y-2">
              <Label>Thumbnail (optional)</Label>
              
              {thumbnailUrl ? (
                // Preview uploaded thumbnail
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img 
                    src={thumbnailUrl} 
                    alt="Video thumbnail" 
                    className="w-full aspect-video object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveThumbnail}
                      disabled={thumbnailUploading}
                    >
                      <Trash01 size={14} aria-hidden="true" className="mr-1.5" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                // Upload drop zone
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed cursor-pointer transition-colors',
                    isDragging 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-muted-foreground/50 hover:bg-muted/50',
                    thumbnailUploading && 'pointer-events-none opacity-50'
                  )}
                >
                  {thumbnailUploading ? (
                    <>
                      <Spinner size="sm" />
                      <span className="text-sm text-muted-foreground">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <div className="p-2 rounded-full bg-muted">
                        <Image01 size={20} className="text-muted-foreground" aria-hidden="true" />
                      </div>
                      <div className="text-center">
                        <span className="text-sm font-medium">Click or drag to upload</span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          PNG, JPG, or WebP (recommended 1280×720)
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {error && (
              <p className="text-xs text-destructive flex items-center gap-1.5">
                <AlertCircle size={12} aria-hidden="true" />
                {error}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={thumbnailUploading}>
              {initialUrl ? 'Update' : 'Insert'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
