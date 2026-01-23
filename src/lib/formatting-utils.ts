/**
 * Shared formatting utilities for consistent data display
 * 
 * @module lib/formatting-utils
 */

import { format, parseISO } from 'date-fns';

// Re-export formatFileSize from file-validation (canonical source)
export { formatFileSize } from './file-validation';

// =============================================================================
// TRIGGER LABELS
// =============================================================================

/**
 * Convert database trigger type to human-readable label
 */
export const getTriggerLabel = (triggerType: string): string => {
  switch (triggerType) {
    case "conversation_end":
      return "End of chat";
    case "manual":
      return "Manual";
    case "inactivity":
      return "Inactivity";
    case "escalation":
      return "Escalation";
    default:
      return triggerType || "Unknown";
  }
};

// =============================================================================
// DATE FORMATTING
// =============================================================================

/**
 * Format a date string or Date object to US format (Dec 1, 2025)
 * Accepts both ISO strings, YYYY-MM-DD format, and Date objects.
 */
export const formatDateUS = (date: string | Date): string => {
  if (!date) return '';
  try {
    if (date instanceof Date) {
      return format(date, 'MMM d, yyyy');
    }
    // Handle both ISO strings and YYYY-MM-DD format
    const parsedDate = date.includes('T') ? parseISO(date) : parseISO(date + 'T00:00:00');
    return format(parsedDate, 'MMM d, yyyy');
  } catch {
    return typeof date === 'string' ? date : ''; // Return original if parsing fails
  }
};

/**
 * Format a date range for display (e.g., "Jan 1 - Jan 31, 2025")
 * Handles same month, same year, and cross-year ranges intelligently.
 * 
 * @param start - Start date
 * @param end - End date
 * @returns Formatted date range string
 */
export const formatDateRange = (start: Date, end: Date): string => {
  // Same month and year
  if (
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear()
  ) {
    return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
  }
  
  // Same year
  if (start.getFullYear() === end.getFullYear()) {
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  }
  
  // Different years
  return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
};

/**
 * Format a date range for compact display (e.g., "Jan 1 - Jan 31")
 * Omits the year for more compact display.
 * 
 * @param start - Start date
 * @param end - End date
 * @returns Compact formatted date range string
 */
export const formatShortDateRange = (start: Date, end: Date): string => {
  // Same month
  if (start.getMonth() === end.getMonth()) {
    return `${format(start, 'MMM d')} - ${format(end, 'd')}`;
  }
  
  return `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`;
};

/**
 * Format a date range from ISO strings for display
 * Convenience wrapper for formatDateRange that accepts strings.
 * 
 * @param startStr - Start date as ISO string
 * @param endStr - End date as ISO string
 * @returns Formatted date range string
 */
export const formatDateRangeFromStrings = (startStr: string, endStr: string): string => {
  try {
    const start = new Date(startStr);
    const end = new Date(endStr);
    return formatDateRange(start, end);
  } catch {
    return `${startStr} - ${endStr}`;
  }
};

// =============================================================================
// TEXT TRUNCATION
// =============================================================================

/**
 * Truncate text with ellipsis
 * 
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated string with ellipsis if necessary
 * 
 * @example
 * truncateText('Hello World', 5) // 'He...'
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

// =============================================================================
// INITIALS EXTRACTION
// =============================================================================

/**
 * Extract initials from a display name or email address.
 * Uses first initial + last initial algorithm for multi-word names.
 * Returns up to 2 uppercase characters.
 * 
 * @param name - Display name (preferred) or email address
 * @param fallbackEmail - Optional email for fallback extraction
 * @returns 1-2 character initials, or '?' if no valid input
 * 
 * @example
 * getInitials('John Smith') // 'JS'
 * getInitials('John Michael Smith') // 'JS' (first + last)
 * getInitials('John') // 'J'
 * getInitials(null, 'jane@test.com') // 'JA'
 * getInitials(null, null) // '?'
 */
export function getInitials(
  name: string | null | undefined,
  fallbackEmail?: string | null
): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    // First initial + last initial
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  if (fallbackEmail) {
    return fallbackEmail.slice(0, 2).toUpperCase();
  }
  return '?';
}
