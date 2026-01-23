/**
 * Suspend Account Dialog
 * 
 * Confirmation dialog for suspending a user account.
 * 
 * @module components/admin/accounts/SuspendAccountDialog
 */

import { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle } from '@untitledui/icons';
import type { AdminAccount } from '@/types/admin';

interface SuspendAccountDialogProps {
  account: AdminAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason?: string) => void;
  isPending: boolean;
}

/**
 * Dialog to confirm account suspension with optional reason.
 */
export function SuspendAccountDialog({
  account,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: SuspendAccountDialogProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason.trim() || undefined);
    setReason('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setReason('');
    }
    onOpenChange(newOpen);
  };

  if (!account) return null;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle size={20} className="text-destructive" aria-hidden="true" />
            </div>
            <AlertDialogTitle>Suspend Account</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            Are you sure you want to suspend <strong>{account.email}</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3 text-sm text-muted-foreground">
            <p className="font-medium text-destructive mb-1">This will:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Immediately sign out the user from all sessions</li>
              <li>Block the user from logging in</li>
              <li>Prevent access to all account data and features</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="suspend-reason">Reason (optional)</Label>
            <Textarea
              id="suspend-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this account being suspended?"
              className="resize-none"
              rows={3}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? 'Suspending...' : 'Suspend Account'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
