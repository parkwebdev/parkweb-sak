/**
 * PromptHistoryPanel Component
 * 
 * Slide-over panel for viewing and restoring prompt versions.
 * 
 * @module components/admin/prompts/PromptHistoryPanel
 */

import { useState } from 'react';
import { formatShortTime } from '@/lib/time-formatting';
import { Clock, RefreshCcw01, ArrowsRight } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePromptHistory, type PromptHistoryEntry } from '@/hooks/admin/usePromptHistory';
import { PROMPT_CONFIG_KEYS } from '@/lib/prompt-defaults';
import { PromptDiffView } from './PromptDiffView';
import type { PromptSection } from './AdminPromptSectionMenu';

interface PromptHistoryPanelProps {
  section: PromptSection;
  sectionLabel: string;
  currentValue: string;
  onRestore: (value: string) => Promise<void>;
}

/** Extract string value from stored format */
function extractHistoryValue(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if ('prompt' in obj && typeof obj.prompt === 'string') return obj.prompt;
    if ('rules' in obj && typeof obj.rules === 'string') return obj.rules;
    if ('text' in obj && typeof obj.text === 'string') return obj.text;
    if ('instruction' in obj && typeof obj.instruction === 'string') return obj.instruction;
  }
  return JSON.stringify(value);
}

export function PromptHistoryPanel({
  section,
  sectionLabel,
  currentValue,
  onRestore,
}: PromptHistoryPanelProps) {
  const [open, setOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<PromptHistoryEntry | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [diffOpen, setDiffOpen] = useState(false);
  const [diffEntry, setDiffEntry] = useState<PromptHistoryEntry | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const configKey = PROMPT_CONFIG_KEYS[section];
  const { data: history, isLoading } = usePromptHistory({
    configKey,
    enabled: open,
  });

  const handleRestore = async () => {
    if (!selectedEntry) return;
    
    setIsRestoring(true);
    try {
      const value = extractHistoryValue(selectedEntry.value);
      await onRestore(value);
      setConfirmOpen(false);
      setOpen(false);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleSelectRestore = (entry: PromptHistoryEntry) => {
    setSelectedEntry(entry);
    setConfirmOpen(true);
  };

  const handleViewDiff = (entry: PromptHistoryEntry) => {
    setDiffEntry(entry);
    setDiffOpen(true);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm">
            History
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
          <SheetHeader>
            <SheetTitle>Version History</SheetTitle>
            <SheetDescription>
              {sectionLabel} — Previous versions
            </SheetDescription>
          </SheetHeader>
          
          <ScrollArea className="flex-1 -mx-6 px-6 mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-3 border border-border rounded-card">
                    <Skeleton className="h-4 w-16 mb-2" />
                    <Skeleton className="h-3 w-32 mb-2" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>
            ) : !history?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock size={32} className="mx-auto mb-2 opacity-50" aria-hidden="true" />
                <p className="text-sm">No version history yet</p>
                <p className="text-xs mt-1">Changes will appear here after you save</p>
              </div>
            ) : (
              <div className="space-y-3 pb-4">
                {history.map((entry, index) => {
                  const value = extractHistoryValue(entry.value);
                  const isCurrent = index === 0;
                  
                  return (
                    <div
                      key={entry.id}
                      className="p-3 border border-border rounded-card hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" size="sm">
                            v{entry.version}
                          </Badge>
                          {index === 0 && (
                            <Badge variant="secondary" size="sm">
                              Latest
                            </Badge>
                          )}
                          {isCurrent && (
                            <Badge size="sm" className="bg-status-active/10 text-status-active-foreground">
                              Current
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatShortTime(new Date(entry.createdAt))}
                        </span>
                      </div>
                      
                      <div className="text-xs font-mono text-muted-foreground bg-muted/50 p-2 rounded max-h-20 overflow-hidden relative">
                        <span className="line-clamp-3">{value}</span>
                        {value.length > 200 && (
                          <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-muted/50 to-transparent" />
                        )}
                      </div>
                      
                      {!isCurrent && (
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => handleViewDiff(entry)}
                          >
                            <ArrowsRight size={14} aria-hidden="true" />
                            View diff
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => handleSelectRestore(entry)}
                          >
                            <RefreshCcw01 size={14} aria-hidden="true" />
                            Restore
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore version {selectedEntry?.version}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace the current {sectionLabel.toLowerCase()} with the selected version.
              The current version will be saved to history before replacing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} disabled={isRestoring}>
              {isRestoring ? 'Restoring...' : 'Restore'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diff View Dialog */}
      <Dialog open={diffOpen} onOpenChange={setDiffOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Compare Changes</DialogTitle>
            <DialogDescription>
              Comparing version {diffEntry?.version} to current {sectionLabel.toLowerCase()}
            </DialogDescription>
          </DialogHeader>
          {diffEntry && (
            <PromptDiffView
              oldValue={extractHistoryValue(diffEntry.value)}
              newValue={currentValue}
              oldLabel={`v${diffEntry.version}`}
              newLabel="Current"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
