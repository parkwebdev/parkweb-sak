export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const formatJoinDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const getRoleColor = (role: string): string => {
  switch (role) {
    case 'super_admin':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
    case 'admin':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
    case 'manager':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700';
  }
};

export const validateCurrentStep = (step: number, data: any): boolean => {
  switch (step) {
    case 1:
      return !!(data.name && data.email && data.phone);
    case 2:
      return !!(data.companyName && data.industry);
    case 3:
      return !!(data.projectType && data.description);
    case 4:
      return !!(data.timeline && data.budgetRange);
    default:
      return false;
  }
};