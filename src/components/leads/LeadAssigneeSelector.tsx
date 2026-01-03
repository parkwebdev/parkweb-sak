/**
 * @fileoverview Dropdown selector for assigning team members to leads.
 * Displays avatars and names with support for unassigning.
 */

import { useMemo } from 'react';
import { User01 } from '@untitledui/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTeam } from '@/hooks/useTeam';

interface LeadAssigneeSelectorProps {
  assignedTo: string | null;
  onAssign: (userId: string | null) => void;
  size?: 'sm' | 'default';
  disabled?: boolean;
}

/**
 * Get initials from a display name
 */
function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function LeadAssigneeSelector({
  assignedTo,
  onAssign,
  size = 'default',
  disabled = false,
}: LeadAssigneeSelectorProps) {
  const { teamMembers, loading } = useTeam();

  // Find the currently assigned member
  const assignedMember = useMemo(() => {
    if (!assignedTo) return null;
    return teamMembers.find(m => m.user_id === assignedTo) || null;
  }, [assignedTo, teamMembers]);

  const handleValueChange = (value: string) => {
    if (value === 'unassigned') {
      onAssign(null);
    } else {
      onAssign(value);
    }
  };

  const triggerSize = size === 'sm' ? 'h-8' : 'h-10';
  const avatarSize = size === 'sm' ? 'h-5 w-5' : 'h-6 w-6';

  return (
    <Select
      value={assignedTo || 'unassigned'}
      onValueChange={handleValueChange}
      disabled={disabled || loading}
    >
      <SelectTrigger className={`${triggerSize} min-w-[140px] max-w-[180px]`}>
        <SelectValue>
          <div className="flex items-center gap-2">
            {assignedMember ? (
              <>
                <Avatar className={avatarSize}>
                  <AvatarImage src={assignedMember.avatar_url || undefined} alt={assignedMember.display_name || ''} />
                  <AvatarFallback className="text-2xs">
                    {getInitials(assignedMember.display_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-sm">
                  {assignedMember.display_name?.split(' ')[0] || 'Assigned'}
                </span>
              </>
            ) : (
              <>
                <div className={`${avatarSize} rounded-full bg-muted flex items-center justify-center`}>
                  <User01 size={size === 'sm' ? 12 : 14} className="text-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">Unassigned</span>
              </>
            )}
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
              <User01 size={14} className="text-muted-foreground" />
            </div>
            <span>Unassigned</span>
          </div>
        </SelectItem>
        {teamMembers.map((member) => (
          <SelectItem key={member.user_id} value={member.user_id}>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={member.avatar_url || undefined} alt={member.display_name || ''} />
                <AvatarFallback className="text-2xs">
                  {getInitials(member.display_name)}
                </AvatarFallback>
              </Avatar>
              <span>{member.display_name || 'Team Member'}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Compact avatar-only display for Kanban cards
 */
export function LeadAssigneeAvatar({
  assignedTo,
  teamMembers,
  size = 'sm',
}: {
  assignedTo: string | null;
  teamMembers: { user_id: string; display_name: string | null; avatar_url: string | null }[];
  size?: 'sm' | 'xs';
}) {
  const assignedMember = useMemo(() => {
    if (!assignedTo) return null;
    return teamMembers.find(m => m.user_id === assignedTo) || null;
  }, [assignedTo, teamMembers]);

  if (!assignedMember) return null;

  const avatarSize = size === 'xs' ? 'h-4 w-4' : 'h-5 w-5';
  const textSize = size === 'xs' ? 'text-[8px]' : 'text-2xs';

  return (
    <Avatar className={avatarSize}>
      <AvatarImage src={assignedMember.avatar_url || undefined} alt={assignedMember.display_name || ''} />
      <AvatarFallback className={textSize}>
        {getInitials(assignedMember.display_name)}
      </AvatarFallback>
    </Avatar>
  );
}
