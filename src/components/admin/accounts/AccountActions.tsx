/**
 * AccountActions Component
 * 
 * Dropdown menu for account management actions with hover quick actions.
 * 
 * @module components/admin/accounts/AccountActions
 */

import { useState } from 'react';
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { RowActions, type QuickAction } from '@/components/ui/row-actions';
import { Eye, SwitchHorizontal01, Check, XClose, Trash01 } from '@untitledui/icons';
import { toast } from 'sonner';
import { useAccountActions } from '@/hooks/admin/useAccountActions';
import { SuspendAccountDialog } from './SuspendAccountDialog';
import { ActivateAccountDialog } from './ActivateAccountDialog';
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
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const { suspend, activate } = useAccountActions();

  const handleSuspendClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSuspendDialog(true);
  };

  const handleActivateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActivateDialog(true);
  };

  const handleSuspendConfirm = async (reason?: string) => {
    await suspend.mutateAsync({
      userId: account.user_id,
      userEmail: account.email,
      reason,
    });
    setShowSuspendDialog(false);
  };

  const handleActivateConfirm = async () => {
    await activate.mutateAsync({
      userId: account.user_id,
      userEmail: account.email,
    });
    setShowActivateDialog(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement delete functionality with confirmation
    toast.info('Delete functionality will be implemented');
  };

  // Quick actions shown on hover
  const quickActions: QuickAction[] = [
    {
      icon: Eye,
      label: 'View',
      onClick: (e) => { e.stopPropagation(); onView(); },
    },
    {
      icon: SwitchHorizontal01,
      label: 'Impersonate',
      onClick: (e) => { e.stopPropagation(); onImpersonate(); },
    },
  ];

  return (
    <>
      <RowActions
        quickActions={quickActions}
        menuContent={
          <>
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
              <DropdownMenuItem onClick={handleSuspendClick}>
                <XClose size={14} className="mr-2" aria-hidden="true" />
                Suspend Account
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={handleActivateClick}>
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
          </>
        }
      />

      <SuspendAccountDialog
        account={account}
        open={showSuspendDialog}
        onOpenChange={setShowSuspendDialog}
        onConfirm={handleSuspendConfirm}
        isPending={suspend.isPending}
      />

      <ActivateAccountDialog
        account={account}
        open={showActivateDialog}
        onOpenChange={setShowActivateDialog}
        onConfirm={handleActivateConfirm}
        isPending={activate.isPending}
      />
    </>
  );
}
