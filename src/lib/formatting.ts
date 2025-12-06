/**
 * General Formatting Utilities
 * 
 * Functions for formatting dates and other display values.
 * @module lib/formatting
 */

/**
 * Formats a date into a human-readable string with customizable options.
 * 
 * @param date - The date to format (string or Date object)
 * @param options - Optional Intl.DateTimeFormatOptions to customize output
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 * 
 * @example
 * // Default format
 * formatDate('2024-01-15')
 * // => 'Jan 15, 2024'
 * 
 * @example
 * // With Date object
 * formatDate(new Date())
 * // => 'Dec 6, 2025'
 * 
 * @example
 * // Custom format options
 * formatDate('2024-01-15', { weekday: 'long', month: 'long' })
 * // => 'Monday, January 15, 2024'
 */
export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  });
};
