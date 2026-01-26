/**
 * Delete Confirmation Dialog Component
 * 
 * A reusable confirmation dialog for destructive delete operations.
 * Requires user to type "DELETE" before allowing deletion.
 * 
 * This is the STANDARD delete confirmation component for the entire app.
 * All delete operations should use this component.
 * 
 * @module components/DeleteConfirmationDialog
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
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Props for the DeleteConfirmationDialog component
 */
interface DeleteConfirmationDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Description explaining what will be deleted */
  description: string;
  /** Word that must be typed to confirm (default: "DELETE") */
  confirmationText?: string;
  /** Callback when deletion is confirmed */
  onConfirm: () => void;
  /** Whether deletion is in progress */
  isDeleting?: boolean;
  /** Custom action button label (default: "Delete") */
  actionLabel?: string;
}

/**
 * Delete confirmation dialog with text verification.
 * User must type "DELETE" (or custom text) to enable the delete button.
 * 
 * @example
 * <DeleteConfirmationDialog
 *   open={showDeleteDialog}
 *   onOpenChange={setShowDeleteDialog}
 *   title="Delete Agent"
 *   description="This will permanently delete the agent and all its data."
 *   onConfirm={handleDelete}
 *   isDeleting={deleting}
 * />
 */
export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmationText = "DELETE",
  onConfirm,
  isDeleting = false,
  actionLabel = "Delete",
}: DeleteConfirmationDialogProps) {
  const [confirmValue, setConfirmValue] = useState('');
  
  // Clear confirmation value and any lingering body locks when dialog closes
  useEffect(() => {
    if (!open) {
      setConfirmValue('');

      // Defensive cleanup: if a portal/dismissable layer failed to release,
      // ensure the app doesn't remain unclickable.
      document.body.style.pointerEvents = '';
      document.body.style.overflow = '';
    }
  }, [open]);

  const isConfirmDisabled = confirmValue !== confirmationText;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>

          <div className="mt-4 space-y-2">
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
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isConfirmDisabled || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
