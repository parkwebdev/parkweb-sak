/**
 * Formatting Utilities
 * 
 * Functions for formatting timestamps, text, and display values in the widget.
 */

/**
 * Format a timestamp into a relative time string
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

/**
 * Truncate a message for preview display
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation (default: 60)
 * @returns Truncated string with ellipsis if necessary
 */
export function truncateMessage(text: string, maxLength: number = 60): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Format a sender name for display (FirstName L.)
 * @param name - Full name to format
 * @returns Formatted name like "John D."
 */
export function formatSenderName(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}
