/**
 * PromptDiffView Component
 * 
 * Displays a line-by-line diff between two prompt versions.
 * Uses a simple diff algorithm with additions/deletions highlighted.
 * 
 * @module components/admin/prompts/PromptDiffView
 */

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PromptDiffViewProps {
  oldValue: string;
  newValue: string;
  oldLabel?: string;
  newLabel?: string;
}

interface DiffLine {
  type: 'unchanged' | 'added' | 'removed';
  content: string;
  lineNumber: number;
}

/**
 * Simple line-by-line diff algorithm.
 */
function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const diff: DiffLine[] = [];
  
  let oldIndex = 0;
  let newIndex = 0;
  let lineNumber = 1;

  // Simple LCS-based diff
  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    if (oldIndex >= oldLines.length) {
      // Only new lines left
      diff.push({ type: 'added', content: newLines[newIndex], lineNumber: lineNumber++ });
      newIndex++;
    } else if (newIndex >= newLines.length) {
      // Only old lines left
      diff.push({ type: 'removed', content: oldLines[oldIndex], lineNumber: lineNumber++ });
      oldIndex++;
    } else if (oldLines[oldIndex] === newLines[newIndex]) {
      // Lines match
      diff.push({ type: 'unchanged', content: oldLines[oldIndex], lineNumber: lineNumber++ });
      oldIndex++;
      newIndex++;
    } else {
      // Lines differ - look ahead to find if old line exists later in new
      const oldLineInNew = newLines.slice(newIndex).indexOf(oldLines[oldIndex]);
      const newLineInOld = oldLines.slice(oldIndex).indexOf(newLines[newIndex]);
      
      if (oldLineInNew === -1 && newLineInOld === -1) {
        // Neither found - show as changed (removed then added)
        diff.push({ type: 'removed', content: oldLines[oldIndex], lineNumber: lineNumber++ });
        diff.push({ type: 'added', content: newLines[newIndex], lineNumber: lineNumber++ });
        oldIndex++;
        newIndex++;
      } else if (oldLineInNew !== -1 && (newLineInOld === -1 || oldLineInNew <= newLineInOld)) {
        // Old line found later in new - new lines were added
        diff.push({ type: 'added', content: newLines[newIndex], lineNumber: lineNumber++ });
        newIndex++;
      } else {
        // New line found later in old - old lines were removed
        diff.push({ type: 'removed', content: oldLines[oldIndex], lineNumber: lineNumber++ });
        oldIndex++;
      }
    }
  }

  return diff;
}

export function PromptDiffView({
  oldValue,
  newValue,
  oldLabel = 'Previous',
  newLabel = 'Current',
}: PromptDiffViewProps) {
  const diffLines = useMemo(() => computeDiff(oldValue, newValue), [oldValue, newValue]);
  
  const stats = useMemo(() => {
    const added = diffLines.filter(l => l.type === 'added').length;
    const removed = diffLines.filter(l => l.type === 'removed').length;
    return { added, removed };
  }, [diffLines]);

  if (oldValue === newValue) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No differences</p>
        <p className="text-xs mt-1">Both versions are identical</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Stats header */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{oldLabel} → {newLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          {stats.added > 0 && (
            <Badge variant="outline" className="bg-status-active/10 text-status-active-foreground border-status-active/20">
              +{stats.added} line{stats.added !== 1 ? 's' : ''}
            </Badge>
          )}
          {stats.removed > 0 && (
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
              -{stats.removed} line{stats.removed !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Diff content */}
      <ScrollArea className="h-[300px] border border-border rounded-card">
        <div className="font-mono text-xs">
          {diffLines.map((line, index) => (
            <div
              key={index}
              className={cn(
                'px-3 py-0.5 flex',
                line.type === 'added' && 'bg-status-active/10 text-status-active-foreground',
                line.type === 'removed' && 'bg-destructive/10 text-destructive line-through',
                line.type === 'unchanged' && 'text-muted-foreground'
              )}
            >
              <span className="w-6 shrink-0 text-muted-foreground/50 select-none">
                {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
              </span>
              <span className="whitespace-pre-wrap break-words flex-1">
                {line.content || '\u00A0'}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
