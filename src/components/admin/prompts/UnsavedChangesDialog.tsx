/**
 * UnsavedChangesDialog Component
 * 
 * Confirmation dialog when user tries to navigate away with unsaved changes.
 * 
 * @module components/admin/prompts/UnsavedChangesDialog
 */

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

interface UnsavedChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
  onSave: () => void;
  isSaving?: boolean;
}

export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onDiscard,
  onSave,
  isSaving = false,
}: UnsavedChangesDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes that will be lost if you continue.
            Would you like to save your changes first?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-muted hover:bg-muted/80 text-foreground"
            onClick={onDiscard}
            disabled={isSaving}
          >
            Discard
          </AlertDialogAction>
          <AlertDialogAction onClick={onSave} disabled={isSaving} className="bg-primary text-primary-foreground">
            {isSaving ? 'Saving...' : 'Save Changes'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
