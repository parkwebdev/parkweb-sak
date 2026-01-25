/**
 * Formatting Utilities
 * 
 * Functions for formatting timestamps, text, and display values in the widget.
 * Re-exports shared utilities from central lib for consistency.
 */

// Re-export shared utilities from central lib
export { formatShortTime, formatSenderName, truncateMessage } from '@/lib/time-formatting';

// Re-export formatShortTime as formatTimestamp for widget compatibility
export { formatShortTime as formatTimestamp } from '@/lib/time-formatting';
