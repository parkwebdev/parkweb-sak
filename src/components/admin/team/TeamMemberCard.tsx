/**
 * TeamMemberCard Component
 * 
 * Card displaying a team member's details.
 * 
 * @module components/admin/team/TeamMemberCard
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RoleBadge } from '@/components/admin/shared/RoleBadge';
import { IconButton } from '@/components/ui/icon-button';
import { Trash01 } from '@untitledui/icons';
import { formatDistanceToNow } from 'date-fns';
import { getInitials } from '@/lib/admin/admin-utils';
import type { PilotTeamMember } from '@/types/admin';

interface TeamMemberCardProps {
  /** Team member data */
  member: PilotTeamMember;
  /** Callback when remove is clicked */
  onRemove?: () => void;
}

/**
 * Team member card component.
 */
export function TeamMemberCard({ member, onRemove }: TeamMemberCardProps) {
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
          <RoleBadge role={member.role} className="text-2xs" />
          <p className="text-2xs text-muted-foreground mt-1">
            {member.audit_action_count} action{member.audit_action_count !== 1 ? 's' : ''}
          </p>
        </div>
        {onRemove && (
          <IconButton label="Remove team member" variant="ghost" size="sm" onClick={onRemove}>
            <Trash01 size={14} className="text-destructive" />
          </IconButton>
        )}
      </div>
    </div>
  );
}
