/**
 * ImpersonateButton Component
 * 
 * Button to initiate impersonation of a user.
 * 
 * @module components/admin/accounts/ImpersonateButton
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SwitchHorizontal01 } from '@untitledui/icons';
import { ImpersonateDialog } from './ImpersonateDialog';

interface ImpersonateButtonProps {
  userId: string;
  userName: string | null;
}

/**
 * Button component for initiating user impersonation.
 */
export function ImpersonateButton({ userId, userName }: ImpersonateButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setDialogOpen(true)}
      >
        <SwitchHorizontal01 size={14} className="mr-1" aria-hidden="true" />
        Impersonate
      </Button>
      <ImpersonateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        userId={userId}
        userName={userName}
      />
    </>
  );
}
