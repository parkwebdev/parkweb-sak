/**
 * Shared formatting utilities for consistent data display
 */

import { format, parseISO } from 'date-fns';

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
