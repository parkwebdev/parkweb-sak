/**
 * Shared formatting utilities for consistent data display
 * 
 * @module lib/formatting-utils
 */

import { format, parseISO } from 'date-fns';

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
 * Format a date string (ISO or YYYY-MM-DD) to US format (Dec 1, 2025)
 */
export const formatDateUS = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    // Handle both ISO strings and YYYY-MM-DD format
    const date = dateStr.includes('T') ? parseISO(dateStr) : parseISO(dateStr + 'T00:00:00');
    return format(date, 'MMM d, yyyy');
  } catch {
    return dateStr; // Return original if parsing fails
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
// FILE SIZE FORMATTING
// =============================================================================

/**
 * Format file size in human-readable format (e.g., "1.5 MB")
 * 
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};
