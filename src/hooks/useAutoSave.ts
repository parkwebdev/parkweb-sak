/**
 * useAutoSave Hook
 * 
 * Unified auto-save hook with 500ms debounce, saving state, and error handling.
 * Standard for all auto-save behavior across the app.
 * 
 * @module hooks/useAutoSave
 * 
 * @example
 * ```tsx
 * const { save, isSaving } = useAutoSave({
 *   onSave: async (value) => {
 *     await updateSettings(value);
 *   },
 * });
 * 
 * // Call on every change
 * <Input onChange={(e) => save(e.target.value)} />
 * 
 * // Optional: show saving indicator
 * <SavingIndicator isSaving={isSaving} />
 * ```
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/types/errors';

interface UseAutoSaveOptions<T> {
  /** Function to call when saving */
  onSave: (value: T) => Promise<void>;
  /** Debounce delay in milliseconds (default: 500) */
  debounceMs?: number;
  /** Custom error handler (defaults to toast) */
  onError?: (error: unknown) => void;
}

interface UseAutoSaveReturn<T> {
  /** Call this on every change - it will debounce and save */
  save: (value: T) => void;
  /** True while save is in progress */
  isSaving: boolean;
  /** Force immediate save (bypasses debounce) */
  saveNow: (value: T) => Promise<void>;
}

/**
 * Creates an auto-save handler with debouncing and error handling.
 * 
 * @param options - Configuration options
 * @returns Object with save function and isSaving state
 */
export function useAutoSave<T>({
  onSave,
  debounceMs = 500,
  onError,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn<T> {
  const [isSaving, setIsSaving] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onSaveRef = useRef(onSave);
  const onErrorRef = useRef(onError);
  const pendingValueRef = useRef<T | null>(null);

  // Keep refs up to date
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const executeSave = useCallback(async (value: T) => {
    setIsSaving(true);
    try {
      await onSaveRef.current(value);
    } catch (error: unknown) {
      if (onErrorRef.current) {
        onErrorRef.current(error);
      } else {
        toast.error('Failed to save', { description: getErrorMessage(error) });
      }
    } finally {
      setIsSaving(false);
    }
  }, []);

  const save = useCallback(
    (value: T) => {
      pendingValueRef.current = value;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        executeSave(value);
      }, debounceMs);
    },
    [debounceMs, executeSave]
  );

  const saveNow = useCallback(
    async (value: T) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      await executeSave(value);
    },
    [executeSave]
  );

  return { save, isSaving, saveNow };
}
