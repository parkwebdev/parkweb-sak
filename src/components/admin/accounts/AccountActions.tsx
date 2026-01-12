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
import { IconButton } from '@/components/ui/icon-button';
import { DotsVertical, Eye, SwitchHorizontal01, Check, XClose, Trash01 } from '@untitledui/icons';
import { toast } from 'sonner';
import type { AdminAccount } from '@/types/admin';

interface AccountActionsProps {
  account: AdminAccount;
  onView: () => void;
  onImpersonate: () => void;
}

/**
 * Dropdown menu for account management actions.
 */
export function AccountActions({ account, onView, onImpersonate }: AccountActionsProps) {
  const handleSuspend = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement suspend functionality
    toast.info('Suspend functionality will be implemented');
  };

  const handleActivate = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement activate functionality
    toast.info('Activate functionality will be implemented');
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement delete functionality with confirmation
    toast.info('Delete functionality will be implemented');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconButton
          variant="ghost"
          size="sm"
          label="Account actions"
          onClick={(e) => e.stopPropagation()}
        >
          <DotsVertical size={16} aria-hidden="true" />
        </IconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(); }}>
          <Eye size={14} className="mr-2" aria-hidden="true" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onImpersonate(); }}>
          <SwitchHorizontal01 size={14} className="mr-2" aria-hidden="true" />
          Impersonate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {account.status === 'active' ? (
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
