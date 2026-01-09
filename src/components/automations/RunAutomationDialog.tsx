/**
 * RunAutomationDialog Component
 * 
 * Confirmation dialog for running manual automations.
 * Shows automation details and optional lead context.
 * 
 * @module components/automations/RunAutomationDialog
 */

import { memo } from 'react';
import { Play, AlertCircle } from '@untitledui/icons';
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

interface RunAutomationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  automation: { 
    id: string; 
    name: string; 
    description?: string | null;
  } | null;
  onRun: () => void;
  running: boolean;
  /** Optional lead context when running on a specific lead */
  leadContext?: { id: string; name: string } | null;
}

export const RunAutomationDialog = memo(function RunAutomationDialog({
  open,
  onOpenChange,
  automation,
  onRun,
  running,
  leadContext,
}: RunAutomationDialogProps) {
  if (!automation) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Play size={20} className="text-primary" aria-hidden="true" />
            Run "{automation.name}"
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            {automation.description && (
              <span className="block">{automation.description}</span>
            )}
            {leadContext && (
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <AlertCircle size={14} className="text-muted-foreground" aria-hidden="true" />
                This automation will run on lead: {leadContext.name}
              </span>
            )}
            {!leadContext && (
              <span className="block">
                Are you sure you want to run this automation now?
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={running}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onRun} disabled={running}>
            <Play size={16} className="mr-1.5" aria-hidden="true" />
            {running ? 'Running...' : 'Run Now'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});
