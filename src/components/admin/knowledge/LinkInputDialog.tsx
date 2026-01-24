/**
 * Link Input Dialog
 * 
 * Dialog for entering URLs when adding links in the article editor.
 * Replaces browser's window.prompt() for better UX.
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LinkInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (url: string) => void;
  initialUrl?: string;
}

export function LinkInputDialog({
  open,
  onOpenChange,
  onSubmit,
  initialUrl = '',
}: LinkInputDialogProps) {
  const [url, setUrl] = useState(initialUrl || 'https://');

  // Reset URL when dialog opens
  useEffect(() => {
    if (open) {
      setUrl(initialUrl || 'https://');
    }
  }, [open, initialUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(url);
    onOpenChange(false);
  };

  const handleRemoveLink = () => {
    onSubmit('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Insert Link</DialogTitle>
          <DialogDescription>
            Enter the URL for the link you want to insert.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            {initialUrl && (
              <Button
                type="button"
                variant="outline"
                onClick={handleRemoveLink}
                className="text-destructive hover:text-destructive"
              >
                Remove Link
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Apply</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
