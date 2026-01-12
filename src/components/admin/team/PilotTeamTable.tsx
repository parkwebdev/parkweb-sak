/**
 * PilotTeamTable Component
 * 
 * Displays and manages the Pilot internal team.
 * 
 * @module components/admin/team/PilotTeamTable
 */

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash01, Plus, Shield01 } from '@untitledui/icons';
import { formatDistanceToNow } from 'date-fns';
import { getInitials } from '@/lib/admin/admin-utils';
import type { PilotTeamMember } from '@/types/admin';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PilotTeamTableProps {
  team: PilotTeamMember[];
  loading: boolean;
  onRemove: (userId: string) => Promise<void>;
  isRemoving?: boolean;
}

/**
 * Pilot team management component.
 */
export function PilotTeamTable({
  team,
  loading,
  onRemove,
  isRemoving,
}: PilotTeamTableProps) {
  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null);

  const handleRemove = async () => {
    if (removeConfirmId) {
      await onRemove(removeConfirmId);
      setRemoveConfirmId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Team Members</h3>
          <p className="text-xs text-muted-foreground">
            {team.length} member{team.length !== 1 ? 's' : ''} with super admin access
          </p>
        </div>
      </div>

      {team.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4">
            <Shield01 size={24} className="text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            No team members found
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {team.map((member) => (
            <TeamMemberCard
              key={member.id}
              member={member}
              onRemove={() => setRemoveConfirmId(member.user_id)}
            />
          ))}
        </div>
      )}

      {/* Remove Confirmation */}
      <AlertDialog open={!!removeConfirmId} onOpenChange={() => setRemoveConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove super admin access from this user. They will be downgraded to a regular admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-destructive text-destructive-foreground"
              disabled={isRemoving}
            >
              {isRemoving ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  onEmailChange: (email: string) => void;
  onInvite: () => Promise<void>;
  isInviting?: boolean;
}) {
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

/**
 * Team member card component.
 */
export function TeamMemberCard({
  member,
  onRemove,
}: {
  member: PilotTeamMember;
  onRemove?: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={member.avatar_url || undefined} />
          <AvatarFallback className="text-xs">
            {getInitials(member.display_name || member.email)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{member.display_name || 'Unnamed'}</p>
          <p className="text-xs text-muted-foreground">{member.email}</p>
          {member.created_at && (
            <p className="text-2xs text-muted-foreground mt-0.5">
              Added {formatDistanceToNow(new Date(member.created_at), { addSuffix: true })}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <Badge variant="secondary" className="text-2xs">
            {member.role}
          </Badge>
          <p className="text-2xs text-muted-foreground mt-1">
            {member.audit_action_count} action{member.audit_action_count !== 1 ? 's' : ''}
          </p>
        </div>
        {onRemove && (
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <Trash01 size={14} className="text-destructive" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Team member actions component.
 */
export function TeamMemberActions({
  memberId,
  onRemove,
}: {
  memberId: string;
  onRemove?: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {onRemove && (
        <Button variant="ghost" size="sm" onClick={() => onRemove(memberId)}>
          <Trash01 size={14} className="text-destructive" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
