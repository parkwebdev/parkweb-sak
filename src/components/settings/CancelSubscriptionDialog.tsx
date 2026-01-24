/**
 * @fileoverview Cancel subscription confirmation dialog.
 * Warns users about losing access and shows the exact end date.
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
import { AlertTriangle } from '@untitledui/icons';
import { formatDate } from '@/lib/formatting';

interface CancelSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  subscriptionEnd: string | null;
  loading?: boolean;
}

export function CancelSubscriptionDialog({
  open,
  onOpenChange,
  onConfirm,
  subscriptionEnd,
  loading = false,
}: CancelSubscriptionDialogProps) {
  const endDate = subscriptionEnd 
    ? formatDate(new Date(subscriptionEnd), { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : 'the end of your billing period';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2 space-y-3">
            <p>
              Are you sure you want to cancel your subscription? You'll continue to have 
              access to all features until <strong>{endDate}</strong>.
            </p>
            <p className="text-muted-foreground">
              After that date, you'll lose access to premium features. You can reactivate 
              anytime before then.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Keep subscription</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Canceling...' : 'Cancel subscription'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
