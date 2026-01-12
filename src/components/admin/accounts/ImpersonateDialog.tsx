/**
 * ImpersonateDialog Component
 * 
 * Dialog for confirming impersonation and entering reason.
 * 
 * @module components/admin/accounts/ImpersonateDialog
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useImpersonation } from '@/hooks/admin/useImpersonation';
import { AlertTriangle } from '@untitledui/icons';

interface ImpersonateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string | null;
}

/**
 * Dialog for confirming and starting an impersonation session.
 */
export function ImpersonateDialog({
  open,
  onOpenChange,
  userId,
  userName,
}: ImpersonateDialogProps) {
  const [reason, setReason] = useState('');
  const { startImpersonation, isStarting } = useImpersonation();

  const handleStart = async () => {
    if (!reason.trim()) return;
    
    await startImpersonation(userId, reason);
    setReason('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" aria-hidden="true" />
            Start Impersonation
          </DialogTitle>
          <DialogDescription>
            You are about to impersonate{' '}
            <span className="font-medium text-foreground">
              {userName || 'this user'}
            </span>
            . This action will be logged for compliance purposes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for impersonation</Label>
            <Textarea
              id="reason"
              placeholder="Enter the reason for this impersonation session..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This reason will be recorded in the audit log.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleStart}
            disabled={!reason.trim() || isStarting}
          >
            {isStarting ? 'Starting...' : 'Start Impersonation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
