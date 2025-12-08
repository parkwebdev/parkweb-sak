/**
 * Error Handling Utilities
 * 
 * Type-safe error handling to replace `catch (error: any)` patterns.
 */

/**
 * Safely extracts an error message from an unknown error type.
 * Use this in catch blocks to replace `error: any`.
 * 
 * @param error - The caught error of unknown type
 * @returns A human-readable error message string
 * 
 * @example
 * ```typescript
 * try {
 *   await riskyOperation();
 * } catch (error: unknown) {
 *   toast.error('Failed', { description: getErrorMessage(error) });
 * }
 * ```
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'An unexpected error occurred';
}

/**
 * Type guard to check if an error has a message property.
 * 
 * @param error - The value to check
 * @returns True if the error has a string message property
 */
export function hasErrorMessage(error: unknown): error is { message: string } {
  return (
    error !== null &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

/**
 * Type guard to check if an error has a code property (e.g., Supabase errors).
 * 
 * @param error - The value to check
 * @returns True if the error has a string code property
 */
export function hasErrorCode(error: unknown): error is { code: string } {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  );
}
