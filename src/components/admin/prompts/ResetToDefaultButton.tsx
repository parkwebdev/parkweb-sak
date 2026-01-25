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
import { Button } from '@/components/ui/button';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <AlertDialogTrigger asChild>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={disabled}
                className="h-8 w-8"
              >
                <RefreshCcw01 size={16} aria-hidden="true" />
                <span className="sr-only">Reset to default</span>
              </Button>
            </TooltipTrigger>
          </AlertDialogTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Reset to default</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
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
