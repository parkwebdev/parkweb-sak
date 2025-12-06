/**
 * Time and Name Formatting Utilities
 * 
 * Shared formatting functions used across the application and widget.
 */

/**
 * Format a date as relative time (e.g., "5 mins ago", "2 hrs ago")
 * @param date - The date to format
 * @returns Formatted string like "now", "5 mins ago", "2 hrs ago", "3 days ago", or "Jan 15"
 */
export const formatShortTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);
  
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHrs < 24) return `${diffHrs} hr${diffHrs > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Format a full name as "FirstName L." (first name + last initial)
 * @param fullName - The full name to format
 * @returns Formatted name like "Aaron C." or "Team Member" if empty
 */
export const formatSenderName = (fullName: string | undefined): string => {
  if (!fullName) return 'Team Member';
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return parts[0];
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase() || '';
  return lastInitial ? `${firstName} ${lastInitial}.` : firstName;
};

/**
 * Truncate a message for preview display
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation (default: 60)
 * @returns Truncated string with ellipsis if necessary
 */
export const truncateMessage = (text: string, maxLength: number = 60): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};
