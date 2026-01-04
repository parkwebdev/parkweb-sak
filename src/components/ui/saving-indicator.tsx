/**
 * SavingIndicator Component
 * 
 * Minimal indicator that shows only during active save.
 * Displays brief "Saving..." text, auto-hides when done.
 * Modern silent-save pattern - no "Saved" confirmation.
 * 
 * @module components/ui/saving-indicator
 * 
 * @example
 * ```tsx
 * const { isSaving } = useAutoSave({ onSave: saveData });
 * 
 * <SavingIndicator isSaving={isSaving} />
 * ```
 */

import { cn } from '@/lib/utils';

interface SavingIndicatorProps {
  /** Whether save is in progress */
  isSaving: boolean;
  /** Custom message (default: "Saving...") */
  message?: string;
  /** Additional className */
  className?: string;
}

export function SavingIndicator({ 
  isSaving, 
  message = 'Saving...', 
  className 
}: SavingIndicatorProps) {
  if (!isSaving) return null;

  return (
    <span 
      className={cn(
        "text-xs text-muted-foreground animate-pulse",
        className
      )}
      role="status"
      aria-live="polite"
    >
      {message}
    </span>
  );
}
