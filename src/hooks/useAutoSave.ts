/**
 * useAutoSave Hook
 * 
 * Unified auto-save hook with 2-second debounce, toast feedback, and error handling.
 * Standard for all auto-save behavior across the app.
 * 
 * @module hooks/useAutoSave
 * 
 * @example
 * ```tsx
 * const { save } = useAutoSave({
 *   onSave: async (value) => {
 *     await updateSettings(value);
 *   },
 * });
 * 
 * // Call on every change - shows toast automatically
 * <Input onChange={(e) => save(e.target.value)} />
 * ```
 */

import { useCallback, useRef, useEffect } from 'react';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/types/errors';

interface UseAutoSaveOptions<T> {
  /** Function to call when saving */
  onSave: (value: T) => Promise<void>;
  /** Debounce delay in milliseconds (default: 2000) */
  debounceMs?: number;
  /** Custom error handler (defaults to toast) */
  onError?: (error: unknown) => void;
  /** Custom saving message (default: "Saving...") */
  savingMessage?: string;
}

interface UseAutoSaveReturn<T> {
  /** Call this on every change - it will debounce and save */
  save: (value: T) => void;
  /** Force immediate save (bypasses debounce) */
  saveNow: (value: T) => Promise<void>;
}

/**
 * Creates an auto-save handler with debouncing, toast feedback, and error handling.
 * 
 * @param options - Configuration options
 * @returns Object with save function
 */
export function useAutoSave<T>({
  onSave,
  debounceMs = 2000,
  onError,
  savingMessage = 'Saving...',
}: UseAutoSaveOptions<T>): UseAutoSaveReturn<T> {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onSaveRef = useRef(onSave);
  const onErrorRef = useRef(onError);
  const savingMessageRef = useRef(savingMessage);

  // Keep refs up to date
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    savingMessageRef.current = savingMessage;
  }, [savingMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const executeSave = useCallback(async (value: T) => {
    const toastId = toast.saving(savingMessageRef.current);
    try {
      await onSaveRef.current(value);
      toast.dismiss(toastId);
    } catch (error: unknown) {
      toast.dismiss(toastId);
      if (onErrorRef.current) {
        onErrorRef.current(error);
      } else {
        toast.error('Failed to save', { description: getErrorMessage(error) });
      }
    }
  }, []);

  const save = useCallback(
    (value: T) => {
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

  return { save, saveNow };
}
