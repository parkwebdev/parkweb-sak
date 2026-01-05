/**
 * @fileoverview Delete event confirmation dialog.
 * Shows event title and requires typing "DELETE" to confirm.
 */

import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CalendarEvent } from '@/types/calendar';

interface DeleteEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
  onConfirmDelete: () => void;
  isDeleting?: boolean;
}

export function DeleteEventDialog({
  open,
  onOpenChange,
  event,
  onConfirmDelete,
  isDeleting = false,
}: DeleteEventDialogProps) {
  const [confirmValue, setConfirmValue] = useState('');
  const confirmationText = 'DELETE';
  
  // Clear confirmation value when dialog closes
  useEffect(() => {
    if (!open) {
      setConfirmValue('');
    }
  }, [open]);

  if (!event) return null;

  const isConfirmDisabled = confirmValue !== confirmationText;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Booking</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              Are you sure you want to delete "{event.title}"? This action cannot be undone.
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
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isConfirmDisabled || isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
