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
  /** Custom saving message (default: "Saving...") */
  savingMessage?: string;
}

type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

interface UseAutoSaveReturn<T> {
  /** Call this on every change - it will debounce and save */
  save: (value: T) => void;
  /** Force immediate save (bypasses debounce) */
  saveNow: (value: T) => Promise<void>;
  /** Current save status */
  status: SaveStatus;
}

/**
 * Creates an auto-save handler with debouncing, toast feedback, and error handling.
 * 
 * @param options - Configuration options
 * @returns Object with save function
 */
/** Minimum time the saving toast should be visible (2 seconds) */
const MINIMUM_TOAST_DURATION = 2000;

export function useAutoSave<T>({
  onSave,
  debounceMs = 500,
  onError,
  savingMessage = 'Saving...',
}: UseAutoSaveOptions<T>): UseAutoSaveReturn<T> {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  const executeSave = useCallback(async (value: T) => {
    setStatus('saving');
    const toastId = toast.saving(savingMessageRef.current);
    const startTime = Date.now();
    
    try {
      await onSaveRef.current(value);
      
      // Ensure toast is visible for minimum duration
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, MINIMUM_TOAST_DURATION - elapsed);
      
      setTimeout(() => {
        toast.dismiss(toastId);
      }, remainingTime);
      
      setStatus('saved');
      // Reset to idle after 3 seconds
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
      statusTimeoutRef.current = setTimeout(() => {
        setStatus('idle');
      }, 3000);
    } catch (error: unknown) {
      toast.dismiss(toastId);
      setStatus('error');
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
      
      setStatus('pending');

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

  return { save, saveNow, status };
}
