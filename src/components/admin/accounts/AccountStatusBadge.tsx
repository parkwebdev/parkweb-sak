/**
 * AccountStatusBadge Component
 * 
 * Badge component for displaying account status.
 * 
 * @module components/admin/accounts/AccountStatusBadge
 */

import { Badge } from '@/components/ui/badge';

interface AccountStatusBadgeProps {
  status: 'active' | 'suspended' | 'pending';
}

/**
 * Badge component for account status.
 */
export function AccountStatusBadge({ status }: AccountStatusBadgeProps) {
  const variants: Record<typeof status, 'default' | 'destructive' | 'secondary'> = {
    active: 'default',
    suspended: 'destructive',
    pending: 'secondary',
  };

  return (
    <Badge variant={variants[status]} className="capitalize">
      {status}
    </Badge>
  );
}
