/**
 * Image Input Dialog
 * 
 * Dialog for entering image URLs when adding images in the article editor.
 * Includes optional alt text field for accessibility.
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
import { AlertCircle } from '@untitledui/icons';

interface ImageInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (url: string, alt?: string) => void;
  initialUrl?: string;
  initialAlt?: string;
}

/**
 * Basic URL validation for images
 */
function isValidImageUrl(url: string): boolean {
  if (!url.trim()) return false;
  
  try {
    const parsed = new URL(url);
    // Must be http or https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function ImageInputDialog({
  open,
  onOpenChange,
  onSubmit,
  initialUrl = '',
  initialAlt = '',
}: ImageInputDialogProps) {
  const [url, setUrl] = useState(initialUrl || '');
  const [alt, setAlt] = useState(initialAlt || '');
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setUrl(initialUrl || '');
      setAlt(initialAlt || '');
      setError(null);
    }
  }, [open, initialUrl, initialAlt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('Please enter an image URL');
      return;
    }

    if (!isValidImageUrl(url)) {
      setError('Please enter a valid image URL (must start with http:// or https://)');
      return;
    }

    onSubmit(url, alt || undefined);
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
          <DialogTitle>Insert Image</DialogTitle>
          <DialogDescription>
            Enter the URL of the image you want to insert.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://example.com/image.jpg"
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
            <div className="space-y-2">
              <Label htmlFor="image-alt">Alt Text (optional)</Label>
              <Input
                id="image-alt"
                type="text"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="Describe the image for accessibility"
              />
              <p className="text-xs text-muted-foreground">
                Alt text helps screen readers describe the image.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Insert</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
