/**
 * DeleteCategoryDialog Component
 * 
 * Confirmation dialog for deleting help article categories.
 * Offers options to move articles to another category or delete all.
 * Requires typing "DELETE" when deleting articles.
 * @module components/agents/DeleteCategoryDialog
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import type { HelpCategory } from '@/hooks/useEmbeddedChatConfig';

interface DeleteCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryName: string;
  articleCount: number;
  otherCategories: HelpCategory[];
  onConfirm: (action: 'move' | 'delete', targetCategory?: string) => void;
}

export const DeleteCategoryDialog = ({
  open,
  onOpenChange,
  categoryName,
  articleCount,
  otherCategories,
  onConfirm,
}: DeleteCategoryDialogProps) => {
  const [action, setAction] = useState<'move' | 'delete'>('move');
  const [targetCategory, setTargetCategory] = useState<string>('');
  const [confirmValue, setConfirmValue] = useState('');
  
  const confirmationText = 'DELETE';
  const requiresConfirmation = action === 'delete' && articleCount > 0;
  const isConfirmed = !requiresConfirmation || confirmValue === confirmationText;

  // Clear state when dialog closes
  useEffect(() => {
    if (!open) {
      setAction('move');
      setTargetCategory('');
      setConfirmValue('');
    }
  }, [open]);

  const handleConfirm = () => {
    if (action === 'move' && !targetCategory) {
      return;
    }
    onConfirm(action, action === 'move' ? targetCategory : undefined);
  };

  // If no articles, just show simple confirmation with DELETE requirement
  if (articleCount === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription className="space-y-4">
              <p>
                Are you sure you want to delete "{categoryName}"? This category has no articles.
              </p>
              <div className="space-y-2">
                <Label>
                  Type <span className="font-mono font-semibold text-foreground">{confirmationText}</span> to confirm:
                </Label>
                <Input
                  value={confirmValue}
                  onChange={(e) => setConfirmValue(e.target.value)}
                  placeholder={confirmationText}
                  className="font-mono"
                  aria-label="Confirmation text"
                />
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => onConfirm('delete')}
              disabled={confirmValue !== confirmationText}
            >
              Delete Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Category: "{categoryName}"</DialogTitle>
          <DialogDescription>
            This category has {articleCount} article{articleCount > 1 ? 's' : ''}. Choose what to do:
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <RadioGroup value={action} onValueChange={(v) => setAction(v as 'move' | 'delete')}>
            <div className="flex items-start space-x-3 mb-4">
              <RadioGroupItem value="move" id="move" className="mt-1" />
              <div className="flex-1 space-y-2">
                <Label htmlFor="move" className="font-medium cursor-pointer">
                  Move all articles to another category
                </Label>
                {action === 'move' && (
                  <Select value={targetCategory} onValueChange={setTargetCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {otherCategories.map((cat) => (
                        <SelectItem key={cat.name} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                      {otherCategories.length === 0 && (
                        <div className="p-2 text-sm text-muted-foreground">
                          No other categories available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="delete" id="delete" className="mt-1" />
              <Label htmlFor="delete" className="font-medium cursor-pointer text-destructive">
                Delete category and all {articleCount} article{articleCount > 1 ? 's' : ''}
              </Label>
            </div>
          </RadioGroup>

          {requiresConfirmation && (
            <div className="space-y-2 pt-2">
              <Label>
                Type <span className="font-mono font-semibold text-foreground">{confirmationText}</span> to confirm:
              </Label>
              <Input
                value={confirmValue}
                onChange={(e) => setConfirmValue(e.target.value)}
                placeholder={confirmationText}
                className="font-mono"
                aria-label="Confirmation text"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={
              (action === 'move' && (!targetCategory || otherCategories.length === 0)) ||
              !isConfirmed
            }
          >
            {action === 'move' ? 'Move & Delete' : 'Delete All'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
