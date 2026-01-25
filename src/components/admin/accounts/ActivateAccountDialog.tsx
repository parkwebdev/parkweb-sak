/**
 * Activate Account Dialog
 * 
 * Confirmation dialog for reactivating a suspended user account.
 * 
 * @module components/admin/accounts/ActivateAccountDialog
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
import { CheckCircle } from '@untitledui/icons';
import type { AdminAccount } from '@/types/admin';

interface ActivateAccountDialogProps {
  account: AdminAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

/**
 * Dialog to confirm account reactivation.
 */
export function ActivateAccountDialog({
  account,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: ActivateAccountDialogProps) {
  if (!account) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-status-active/10">
              <CheckCircle size={20} className="text-status-active" aria-hidden="true" />
            </div>
            <AlertDialogTitle>Activate Account</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            Are you sure you want to reactivate <strong>{account.email}</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-2">
          <div className="rounded-card bg-status-active/5 border border-status-active/20 p-3 text-sm text-muted-foreground">
            <p className="font-medium text-status-active mb-1">This will:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Allow the user to log in again</li>
              <li>Restore access to all account data and features</li>
              <li>Resume any active subscriptions</li>
            </ul>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-status-active text-white hover:bg-status-active/90"
          >
            {isPending ? 'Activating...' : 'Activate Account'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
