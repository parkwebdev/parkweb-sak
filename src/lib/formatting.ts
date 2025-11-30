// Formatting utilities for the application

/**
 * Formats status values to proper display format
 */
export const formatStatus = (status: string): string => {
  if (!status) return 'Unknown';
  
  // Handle specific status mappings
  const statusMap: { [key: string]: string } = {
    'sow-generated': 'SOW Generated',
    'in-progress': 'In Progress',
    'client-review': 'Client Review',
    'agency-review': 'Agency Review',
  };
  
  return statusMap[status] || status;
};

/**
 * Truncates text to specified length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Formats date to readable string
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

/**
 * Converts percentage to readable format with symbol
 */
export const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`;
};