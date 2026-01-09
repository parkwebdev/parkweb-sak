/**
 * AdvancedModeToggle Component
 * 
 * A toggle for switching between simplified and advanced mode in config panels.
 * Stores preference in localStorage per user.
 * 
 * @module components/automations/panels/AdvancedModeToggle
 */

import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from '@untitledui/icons';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface AdvancedModeToggleProps {
  /** Content to show in advanced mode */
  children: React.ReactNode;
  /** Storage key for persisting state */
  storageKey?: string;
  /** Default open state */
  defaultOpen?: boolean;
}

const STORAGE_PREFIX = 'automation_advanced_mode_';

export function AdvancedModeToggle({
  children,
  storageKey = 'default',
  defaultOpen = false,
}: AdvancedModeToggleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Load saved preference on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}${storageKey}`);
      if (saved !== null) {
        setIsOpen(saved === 'true');
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [storageKey]);

  // Save preference when changed
  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${storageKey}`, String(open));
    } catch {
      // Ignore localStorage errors
    }
  }, [storageKey]);

  return (
    <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between py-2 text-xs text-muted-foreground hover:text-foreground transition-colors border-t border-border mt-4 pt-4"
        >
          <span>Advanced settings</span>
          {isOpen ? (
            <ChevronUp size={14} aria-hidden="true" />
          ) : (
            <ChevronDown size={14} aria-hidden="true" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 pt-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * Hook for managing advanced mode state
 */
export function useAdvancedMode(storageKey: string = 'global') {
  const [isAdvanced, setIsAdvanced] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}${storageKey}`);
      if (saved !== null) {
        setIsAdvanced(saved === 'true');
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [storageKey]);

  const toggleAdvanced = useCallback(() => {
    setIsAdvanced((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${storageKey}`, String(next));
      } catch {
        // Ignore localStorage errors
      }
      return next;
    });
  }, [storageKey]);

  return { isAdvanced, toggleAdvanced };
}
