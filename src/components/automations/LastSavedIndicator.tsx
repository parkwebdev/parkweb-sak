/**
 * LastSavedIndicator Component
 * 
 * Shows "Last saved X ago" or saving status in the toolbar.
 * 
 * @module components/automations/LastSavedIndicator
 */

import { useState, useEffect } from 'react';
import { Check, AlertCircle, Loading01 } from '@untitledui/icons';
import { cn } from '@/lib/utils';

interface LastSavedIndicatorProps {
  lastSavedAt: Date | null;
  saving: boolean;
  isDirty: boolean;
  saveError?: boolean;
}

/**
 * Formats a date to relative time (e.g., "2m ago", "just now").
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffSeconds < 10) return 'just now';
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

export function LastSavedIndicator({
  lastSavedAt,
  saving,
  isDirty,
  saveError = false,
}: LastSavedIndicatorProps) {
  const [, setTick] = useState(0);

  // Update display every 10 seconds to keep "X ago" current
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  if (saving) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loading01 size={14} className="animate-spin" aria-hidden="true" />
        <span>Saving...</span>
      </div>
    );
  }

  if (saveError) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-destructive">
        <AlertCircle size={14} aria-hidden="true" />
        <span>Save failed</span>
      </div>
    );
  }

  if (isDirty) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-warning" />
        <span>Unsaved changes</span>
      </div>
    );
  }

  if (lastSavedAt) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Check size={14} className="text-status-active" aria-hidden="true" />
        <span>Saved {formatRelativeTime(lastSavedAt)}</span>
      </div>
    );
  }

  return null;
}
