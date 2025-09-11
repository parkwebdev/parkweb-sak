// Status-related utilities and helpers

export const getStatusColor = (status: string, type: 'onboarding' | 'project' | 'request' = 'onboarding') => {
  if (type === 'onboarding') {
    switch (status) {
      case 'Sent': 
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
      case 'In Progress': 
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800';
      case 'Completed': 
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800';
      case 'SOW Generated': 
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800';
      case 'Approved': 
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800';
      default: 
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';
    }
  }
  
  if (type === 'request') {
    switch (status) {
      case 'To Do':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
      case 'In Progress':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800';
      case 'On Hold':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800';
      case 'Completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';
    }
  }
  
  // Project status colors
  switch (status) {
    case 'Complete':
      return 'complete';
    case 'In Review':
      return 'in-review';
    case 'Incomplete':
      return 'incomplete';
    default:
      return 'default';
  }
};

export const getClientStatusColor = (status: string) => {
  switch (status) {
    case 'Active':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
    case 'Inactive':
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800';
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700';
  }
};

export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Complete':
      return 'Check';
    case 'In Review':
      return 'Clock';
    case 'Incomplete':
      return 'User';
    default:
      return null;
  }
};

export const formatDate = (dateString: string, options?: Intl.DateTimeFormatOptions) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });
};

export const getBadgeVariant = (status: string): 'default' | 'online' | 'folder' | 'complete' | 'incomplete' | 'in-review' => {
  switch (status) {
    case 'Complete':
    case 'Approved':
      return 'complete';
    case 'In Review':
      return 'in-review';
    case 'Incomplete':
    case 'Draft':
      return 'incomplete';
    default:
      return 'default';
  }
};

export type StatusType = 'Sent' | 'In Progress' | 'Completed' | 'SOW Generated' | 'Approved' | 'Complete' | 'Incomplete' | 'In Review';