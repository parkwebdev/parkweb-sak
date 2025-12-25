/**
 * SimpleDeleteDialog Component
 * 
 * A pre-configured delete confirmation dialog built on AlertDialog.
 * Provides consistent delete UX with loading states and customizable text.
 * 
 * @module components/ui/simple-delete-dialog
 * 
 * @example
 * ```tsx
 * <SimpleDeleteDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Delete Item"
 *   description="Are you sure? This cannot be undone."
 *   onConfirm={handleDelete}
 *   isDeleting={isPending}
 * />
 * ```
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

interface SimpleDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  actionLabel?: string;
  isDeleting?: boolean;
  destructive?: boolean;
}

export const SimpleDeleteDialog = ({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  actionLabel = 'Delete',
  isDeleting,
  destructive = true,
}: SimpleDeleteDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className={destructive ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
          >
            {isDeleting ? 'Deleting...' : actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
