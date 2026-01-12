/**
 * AccountActions Component
 * 
 * Dropdown menu for account management actions.
 * 
 * @module components/admin/accounts/AccountActions
 */

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { DotsVertical, Check, XClose, Trash01 } from '@untitledui/icons';
import { toast } from 'sonner';

interface AccountActionsProps {
  accountId: string;
  status: 'active' | 'suspended' | 'pending';
}

/**
 * Dropdown menu for account management actions.
 */
export function AccountActions({ accountId, status }: AccountActionsProps) {
  const handleSuspend = () => {
    // TODO: Implement suspend functionality
    toast.info('Suspend functionality will be implemented');
  };

  const handleActivate = () => {
    // TODO: Implement activate functionality
    toast.info('Activate functionality will be implemented');
  };

  const handleDelete = () => {
    // TODO: Implement delete functionality with confirmation
    toast.info('Delete functionality will be implemented');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <DotsVertical size={14} aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {status === 'active' ? (
          <DropdownMenuItem onClick={handleSuspend}>
            <XClose size={14} className="mr-2" aria-hidden="true" />
            Suspend Account
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={handleActivate}>
            <Check size={14} className="mr-2" aria-hidden="true" />
            Activate Account
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash01 size={14} className="mr-2" aria-hidden="true" />
          Delete Account
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
