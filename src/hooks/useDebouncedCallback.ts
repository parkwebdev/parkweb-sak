/**
 * useDebouncedCallback Hook
 * 
 * Returns a debounced version of a callback function.
 * Automatically cleans up timeout on unmount.
 * 
 * @module hooks/useDebouncedCallback
 */

import { useCallback, useRef, useEffect } from 'react';

/**
 * Creates a debounced version of a callback function.
 * 
 * @param callback - Function to debounce
 * @param delay - Debounce delay in milliseconds (default: 500)
 * @returns Debounced callback function
 * 
 * @example
 * // Auto-save with 1 second debounce
 * const debouncedSave = useDebouncedCallback(async (data: FormData) => {
 *   await saveToDatabase(data);
 * }, 1000);
 * 
 * // Call on every change - only executes after 1s of no calls
 * const handleChange = (value: string) => {
 *   setLocalValue(value);
 *   debouncedSave({ field: value });
 * };
 * 
 * @remarks
 * - Timer is automatically cleared on component unmount
 * - Each call resets the timer
 * - Callback reference can change without resetting debounce
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref up to date without resetting timer
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
}
