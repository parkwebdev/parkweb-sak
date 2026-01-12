/**
 * InviteTeamMemberDialog Component
 * 
 * Dialog for inviting new super admin team members.
 * 
 * @module components/admin/team/InviteTeamMemberDialog
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface InviteTeamMemberDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Current email value */
  email: string;
  /** Callback when email changes */
  onEmailChange: (email: string) => void;
  /** Callback when invite is submitted */
  onInvite: () => Promise<void>;
  /** Whether invite is in progress */
  isInviting?: boolean;
}

/**
 * Invite team member dialog.
 */
export function InviteTeamMemberDialog({
  open,
  onOpenChange,
  email,
  onEmailChange,
  onInvite,
  isInviting,
}: InviteTeamMemberDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Add a new super admin to the Pilot team
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email Address</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="team@example.com"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            The user must already have an account. They will be promoted to super admin.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onInvite} disabled={!email || isInviting}>
            {isInviting ? 'Inviting...' : 'Send Invite'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
