/**
 * useAutomationAutoSave Hook
 * 
 * Auto-save hook for automation flow changes with 3s debounce.
 * Tracks last saved time and provides save status.
 * 
 * @module hooks/useAutomationAutoSave
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { useFlowStore } from '@/stores/automationFlowStore';
import { useAutomations } from '@/hooks/useAutomations';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/types/errors';
import type { Automation } from '@/types/automations';

/** Auto-save debounce delay in milliseconds */
const AUTO_SAVE_DELAY_MS = 3000;

interface UseAutomationAutoSaveOptions {
  /** The automation being edited */
  automation: Automation | null;
  /** Whether auto-save is enabled */
  enabled?: boolean;
}

interface UseAutomationAutoSaveReturn {
  /** Whether a save is in progress */
  saving: boolean;
  /** Last saved timestamp */
  lastSavedAt: Date | null;
  /** Manually trigger a save */
  saveNow: () => Promise<void>;
  /** Whether there was a save error */
  saveError: boolean;
}

/**
 * Hook for auto-saving automation flow changes.
 * 
 * @example
 * ```tsx
 * const { saving, lastSavedAt, saveNow } = useAutomationAutoSave({
 *   automation,
 *   enabled: true,
 * });
 * ```
 */
export function useAutomationAutoSave({
  automation,
  enabled = true,
}: UseAutomationAutoSaveOptions): UseAutomationAutoSaveReturn {
  const { updateAutomation, updating } = useAutomations();
  const { nodes, edges, viewport, isDirty, markClean } = useFlowStore();
  
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState(false);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savingRef = useRef(false);

  // Execute save
  const executeSave = useCallback(async () => {
    if (!automation || savingRef.current) return;
    
    savingRef.current = true;
    setSaveError(false);

    try {
      await updateAutomation({
        id: automation.id,
        nodes,
        edges,
        viewport,
      });
      markClean();
      setLastSavedAt(new Date());
    } catch (error: unknown) {
      setSaveError(true);
      toast.error('Auto-save failed', { description: getErrorMessage(error) });
    } finally {
      savingRef.current = false;
    }
  }, [automation, nodes, edges, viewport, updateAutomation, markClean]);

  // Schedule auto-save when flow changes
  useEffect(() => {
    if (!enabled || !automation || !isDirty) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule new save
    timeoutRef.current = setTimeout(() => {
      executeSave();
    }, AUTO_SAVE_DELAY_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, automation, isDirty, nodes, edges, viewport, executeSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Manual save
  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await executeSave();
  }, [executeSave]);

  return {
    saving: updating || savingRef.current,
    lastSavedAt,
    saveNow,
    saveError,
  };
}
