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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertCircle } from '@untitledui/icons';

interface DeleteLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadIds: string[];
  hasConversations: boolean;
  onConfirm: (deleteConversations: boolean) => Promise<void>;
  isDeleting?: boolean;
}

export const DeleteLeadDialog = ({
  open,
  onOpenChange,
  leadIds,
  hasConversations,
  onConfirm,
  isDeleting = false,
}: DeleteLeadDialogProps) => {
  const [deleteOption, setDeleteOption] = useState<'lead-only' | 'lead-and-conversation'>('lead-only');
  const [confirmValue, setConfirmValue] = useState('');
  
  const count = leadIds.length;
  const isBulk = count > 1;
  const requiresConfirmation = isBulk;
  const confirmationText = 'delete';
  const isConfirmed = !requiresConfirmation || confirmValue.toLowerCase() === confirmationText;

  const handleConfirm = async () => {
    await onConfirm(deleteOption === 'lead-and-conversation');
    setDeleteOption('lead-only');
    setConfirmValue('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setDeleteOption('lead-only');
      setConfirmValue('');
    }
    onOpenChange(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {count} lead{isBulk ? 's' : ''}?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                This action cannot be undone. {isBulk ? 'These leads' : 'This lead'} will be permanently deleted.
              </p>
              
              {hasConversations && (
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                    <p className="text-sm">
                      {isBulk ? 'Some of these leads have' : 'This lead has'} associated conversation{isBulk ? 's' : ''}.
                    </p>
                  </div>
                  
                  <RadioGroup
                    value={deleteOption}
                    onValueChange={(value) => setDeleteOption(value as 'lead-only' | 'lead-and-conversation')}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="lead-only" id="lead-only" />
                      <Label htmlFor="lead-only" className="font-normal cursor-pointer">
                        Delete lead{isBulk ? 's' : ''} only (keep conversation{isBulk ? 's' : ''})
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="lead-and-conversation" id="lead-and-conversation" />
                      <Label htmlFor="lead-and-conversation" className="font-normal cursor-pointer">
                        Delete lead{isBulk ? 's' : ''} and conversation{isBulk ? 's' : ''}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
              
              {requiresConfirmation && (
                <div className="space-y-2">
                  <p className="text-sm">
                    Type <span className="font-mono font-semibold">{confirmationText}</span> to confirm:
                  </p>
                  <Input
                    value={confirmValue}
                    onChange={(e) => setConfirmValue(e.target.value)}
                    placeholder={confirmationText}
                    className="font-mono"
                  />
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isConfirmed || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : `Delete ${count > 1 ? count + ' leads' : 'Lead'}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
