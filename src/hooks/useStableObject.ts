/**
 * useStableObject Hook
 * 
 * Memoizes an object by its serialized value, preventing infinite re-render loops
 * when object literals are passed as props or dependencies.
 * 
 * Problem this solves:
 * ```tsx
 * // BAD: Creates new object reference every render → infinite useEffect loops
 * useAnalytics({ filters: { status: 'all' } });
 * 
 * // GOOD: Stable reference until values change
 * const filters = useStableObject({ status: 'all' });
 * useAnalytics({ filters });
 * ```
 * 
 * @module hooks/useStableObject
 * @see src/hooks/useAnalytics.ts - Example of primitive dependency pattern
 */

import { useRef } from 'react';

/**
 * Returns a stable object reference that only changes when the object's
 * serialized value changes. Safe for use in dependency arrays.
 * 
 * @param obj - Object to stabilize
 * @returns Stable object reference
 * 
 * @example
 * // Instead of inline object literals in hooks:
 * const filters = useStableObject({ leadStatus: 'all', conversationStatus: 'all' });
 * const data = useAnalyticsData({ filters });
 * 
 * @example
 * // Safe for useEffect dependencies:
 * const options = useStableObject({ enabled: true, limit: 10 });
 * useEffect(() => {
 *   fetchData(options);
 * }, [options]); // Won't cause infinite loops
 */
export function useStableObject<T extends object>(obj: T): T {
  const ref = useRef<T>(obj);
  const prevKeyRef = useRef<string>('');
  
  // Serialize to compare values (handles nested objects)
  const currentKey = JSON.stringify(obj);
  
  // Only update ref if values changed
  if (prevKeyRef.current !== currentKey) {
    prevKeyRef.current = currentKey;
    ref.current = obj;
  }
  
  return ref.current;
}

/**
 * Returns a stable array reference that only changes when the array's
 * serialized value changes. Safe for use in dependency arrays.
 * 
 * @param arr - Array to stabilize
 * @returns Stable array reference
 * 
 * @example
 * const ids = useStableArray([1, 2, 3]);
 * useEffect(() => {
 *   fetchItems(ids);
 * }, [ids]); // Won't cause infinite loops
 */
export function useStableArray<T>(arr: T[]): T[] {
  const ref = useRef<T[]>(arr);
  const prevKeyRef = useRef<string>('');
  
  const currentKey = JSON.stringify(arr);
  
  if (prevKeyRef.current !== currentKey) {
    prevKeyRef.current = currentKey;
    ref.current = arr;
  }
  
  return ref.current;
}

export default useStableObject;
