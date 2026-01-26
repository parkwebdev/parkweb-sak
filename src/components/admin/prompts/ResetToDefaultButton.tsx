/**
 * ResetToDefaultButton Component
 * 
 * Button to reset a prompt section to its default value.
 * Includes confirmation dialog.
 * 
 * @module components/admin/prompts/ResetToDefaultButton
 */

import { useState } from 'react';
import { RefreshCcw01 } from '@untitledui/icons';
import { IconButton } from '@/components/ui/icon-button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ResetToDefaultButtonProps {
  onReset: () => void;
  disabled?: boolean;
  sectionName: string;
}

export function ResetToDefaultButton({
  onReset,
  disabled,
  sectionName,
}: ResetToDefaultButtonProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onReset();
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <IconButton
          label="Reset to default"
          variant="ghost"
          size="sm"
          disabled={disabled}
        >
          <RefreshCcw01 size={16} />
        </IconButton>
      </AlertDialogTrigger>
      
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset {sectionName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will replace your custom prompt with the platform default. 
            You can restore previous versions from the history if needed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Reset to Default
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
