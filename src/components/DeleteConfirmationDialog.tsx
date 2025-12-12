/**
 * Delete Confirmation Dialog Component
 * 
 * A reusable confirmation dialog for destructive delete operations.
 * Requires user to type a confirmation word before allowing deletion.
 * 
 * @module components/DeleteConfirmationDialog
 */

import React from 'react';
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
  /** Word that must be typed to confirm (default: "delete") */
  confirmationText?: string;
  /** Current value of the confirmation input */
  confirmationValue?: string;
  /** Callback when confirmation input changes */
  onConfirmationValueChange?: (value: string) => void;
  /** Callback when deletion is confirmed */
  onConfirm: () => void;
  /** Whether deletion is in progress */
  isDeleting?: boolean;
}

/**
 * Delete confirmation dialog with text verification.
 * User must type the exact confirmation text to enable the delete button.
 * 
 * @example
 * <DeleteConfirmationDialog
 *   open={showDeleteDialog}
 *   onOpenChange={setShowDeleteDialog}
 *   title="Delete Agent"
 *   description="This will permanently delete the agent and all its data."
 *   confirmationValue={confirmText}
 *   onConfirmationValueChange={setConfirmText}
 *   onConfirm={handleDelete}
 *   isDeleting={deleting}
 * />
 */
export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmationText = "delete",
  confirmationValue = "",
  onConfirmationValueChange,
  onConfirm,
  isDeleting = false,
}: DeleteConfirmationDialogProps) {
  const isConfirmDisabled = confirmationValue !== confirmationText;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>{description}</p>
            <div className="space-y-2">
              <Label>
                Type <span className="font-semibold text-foreground">{confirmationText}</span> to confirm:
              </Label>
              <Input
                value={confirmationValue}
                onChange={(e) => onConfirmationValueChange?.(e.target.value)}
                placeholder={confirmationText}
                aria-label="Confirmation text"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isConfirmDisabled || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}