import { INDUSTRY_OPTIONS } from './constants';

/**
 * Formats business type from stored value to display label
 * Handles both kebab-case values and full labels for backward compatibility
 */
export const formatBusinessType = (value: string | null | undefined): string => {
  if (!value) return 'Unknown';
  
  // First check if it's already a properly formatted label
  const existingLabel = INDUSTRY_OPTIONS.find(option => option.label === value);
  if (existingLabel) {
    return value;
  }
  
  // Then check if it's a stored value that needs conversion
  const option = INDUSTRY_OPTIONS.find(option => option.value === value);
  if (option) {
    return option.label;
  }
  
  // Handle legacy/custom values by converting kebab-case to Title Case
  return value
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

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