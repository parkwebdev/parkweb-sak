/**
 * Video Input Dialog
 * 
 * Dialog for entering video URLs when adding/editing videos in the article editor.
 * Supports YouTube, Vimeo, Loom, Wistia, and direct video files.
 */

import { useState, useEffect } from 'react';
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
import { isValidVideoUrl } from '@/lib/video-utils';
import { AlertCircle } from '@untitledui/icons';

interface VideoInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (url: string) => void;
  initialUrl?: string;
}

export function VideoInputDialog({
  open,
  onOpenChange,
  onSubmit,
  initialUrl = '',
}: VideoInputDialogProps) {
  const [url, setUrl] = useState(initialUrl || '');
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setUrl(initialUrl || '');
      setError(null);
    }
  }, [open, initialUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('Please enter a video URL');
      return;
    }

    if (!isValidVideoUrl(url)) {
      setError('Please enter a valid video URL (YouTube, Vimeo, Loom, Wistia, or direct video file)');
      return;
    }

    onSubmit(url);
    onOpenChange(false);
  };

  const handleRemoveVideo = () => {
    onSubmit('');
    onOpenChange(false);
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (error) setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialUrl ? 'Edit Video' : 'Insert Video'}</DialogTitle>
          <DialogDescription>
            Supports YouTube, Vimeo, Loom, Wistia, or direct video file URLs.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="video-url">Video URL</Label>
              <Input
                id="video-url"
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                autoFocus
                error={!!error}
              />
              {error && (
                <p className="text-xs text-destructive flex items-center gap-1.5">
                  <AlertCircle size={12} aria-hidden="true" />
                  {error}
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            {initialUrl && (
              <Button
                type="button"
                variant="outline"
                onClick={handleRemoveVideo}
                className="text-destructive hover:text-destructive"
              >
                Remove Video
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {initialUrl ? 'Update' : 'Insert'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
