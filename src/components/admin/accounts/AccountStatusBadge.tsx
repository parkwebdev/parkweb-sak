/**
 * AccountStatusBadge Component
 * 
 * Badge component for displaying account status using semantic status colors.
 * 
 * @module components/admin/accounts/AccountStatusBadge
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type AccountStatus = 'active' | 'inactive' | 'suspended';

interface AccountStatusBadgeProps {
  status: AccountStatus;
}

/**
 * Status style configuration using design system semantic tokens.
 */
const STATUS_STYLES: Record<AccountStatus, string> = {
  active: 'bg-status-active/10 text-status-active-foreground border-status-active/20',
  inactive: 'bg-status-draft/10 text-status-draft-foreground border-status-draft/20',
  suspended: 'bg-status-suspended/10 text-status-suspended-foreground border-status-suspended/20',
};

/**
 * Badge component for account status with semantic colors.
 */
export function AccountStatusBadge({ status }: AccountStatusBadgeProps) {
  return (
    <Badge 
      variant="outline" 
      className={cn('capitalize', STATUS_STYLES[status])}
    >
      {status}
    </Badge>
  );
}
