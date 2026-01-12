/**
 * StatusBadge Component
 * 
 * Shared badge component for displaying status with consistent
 * capitalization and semantic colors across the admin dashboard.
 * 
 * @module components/admin/shared/StatusBadge
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusType = 'account' | 'subscription' | 'email' | 'generic';

interface StatusBadgeProps {
  /** The status value to display */
  status: string;
  /** The type of status for semantic color mapping */
  type?: StatusType;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Status style configuration using design system semantic tokens.
 * Maps lowercase status values to their corresponding styles.
 */
const STATUS_STYLES: Record<string, string> = {
  // Account statuses
  active: 'bg-status-active/10 text-status-active-foreground border-status-active/20',
  pending: 'bg-status-pending/10 text-status-pending-foreground border-status-pending/20',
  suspended: 'bg-status-suspended/10 text-status-suspended-foreground border-status-suspended/20',
  
  // Email statuses
  delivered: 'bg-status-active/10 text-status-active-foreground border-status-active/20',
  bounced: 'bg-destructive/10 text-destructive border-destructive/20',
  failed: 'bg-destructive/10 text-destructive border-destructive/20',
  sent: 'bg-muted text-muted-foreground border-border',
  opened: 'bg-primary/10 text-primary border-primary/20',
  clicked: 'bg-primary/10 text-primary border-primary/20',
  
  // Subscription statuses
  trialing: 'bg-status-pending/10 text-status-pending-foreground border-status-pending/20',
  canceled: 'bg-muted text-muted-foreground border-border',
  past_due: 'bg-destructive/10 text-destructive border-destructive/20',
  incomplete: 'bg-status-pending/10 text-status-pending-foreground border-status-pending/20',
  incomplete_expired: 'bg-destructive/10 text-destructive border-destructive/20',
  unpaid: 'bg-destructive/10 text-destructive border-destructive/20',
};

/**
 * Shared badge component for status display with automatic capitalization
 * and semantic color mapping.
 */
export function StatusBadge({ status, type = 'generic', className }: StatusBadgeProps) {
  const styleKey = status.toLowerCase();
  const customStyles = STATUS_STYLES[styleKey];
  
  return (
    <Badge 
      variant="outline"
      className={cn('capitalize', customStyles, className)}
    >
      {status}
    </Badge>
  );
}
