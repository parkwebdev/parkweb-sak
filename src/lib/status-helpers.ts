// Status-related utilities and helpers

export const getStatusColor = (status: string, type: 'onboarding' | 'project' = 'onboarding') => {
  if (type === 'onboarding') {
    switch (status) {
      case 'Sent': 
        return 'bg-info/10 text-info-foreground border-info/20';
      case 'In Progress': 
        return 'bg-warning/10 text-warning-foreground border-warning/20';
      case 'Completed': 
        return 'bg-success/10 text-success-foreground border-success/20';
      case 'SOW Generated': 
        return 'bg-primary/10 text-primary-foreground border-primary/20';
      case 'Approved': 
        return 'bg-success/10 text-success-foreground border-success/20';
      default: 
        return 'bg-muted text-muted-foreground border-border';
    }
  }
  
  // Project status colors
  switch (status) {
    case 'Complete':
      return 'default';
    case 'In Review':
      return 'online';
    case 'Incomplete':
      return 'folder';
    default:
      return 'outline';
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

export type StatusType = 'Sent' | 'In Progress' | 'Completed' | 'SOW Generated' | 'Approved' | 'Complete' | 'Incomplete' | 'In Review';