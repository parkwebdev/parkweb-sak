/**
 * Formatting Utilities
 * 
 * Functions for formatting timestamps, text, and display values in the widget.
 * Re-exports shared utilities from central lib for consistency.
 */

// Re-export shared utilities from central lib
export { formatShortTime, formatSenderName, truncateMessage } from '@/lib/time-formatting';

/**
 * Format a timestamp into a compact relative time string (widget-specific)
 * @param date - The date to format
 * @returns Formatted string like "5m ago", "2h ago", "3d ago", or "Jan 15"
 */
export function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) return `${diffMins}m ago`;
  else if (diffHours < 24) return `${diffHours}h ago`;
  else if (diffDays < 7) return `${diffDays}d ago`;
  else return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
