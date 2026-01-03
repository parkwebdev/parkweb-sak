/**
 * @fileoverview Multi-assignee picker with stacked avatars and dashed add button.
 * Displays overlapping avatars for current assignees with a + button to add more.
 */

import { useMemo, useState } from 'react';
import { Plus, User01, Check } from '@untitledui/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useTeam } from '@/hooks/useTeam';
import { cn } from '@/lib/utils';

interface LeadAssigneePickerProps {
  leadId: string;
  assignees: string[];
  onAdd: (userId: string) => void;
  onRemove: (userId: string) => void;
  size?: 'sm' | 'default';
  maxVisible?: number;
  disabled?: boolean;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function LeadAssigneePicker({
  leadId,
  assignees,
  onAdd,
  onRemove,
  size = 'default',
  maxVisible = 3,
  disabled = false,
}: LeadAssigneePickerProps) {
  const { teamMembers, loading } = useTeam();
  const [open, setOpen] = useState(false);

  // Get team member details for assigned users
  const assignedMembers = useMemo(() => {
    return assignees
      .map((userId) => teamMembers.find((m) => m.user_id === userId))
      .filter(Boolean) as typeof teamMembers;
  }, [assignees, teamMembers]);

  const visibleMembers = assignedMembers.slice(0, maxVisible);
  const overflowCount = Math.max(0, assignedMembers.length - maxVisible);

  const avatarSize = size === 'sm' ? 'h-6 w-6' : 'h-7 w-7';
  const dashedSize = size === 'sm' ? 'h-6 w-6' : 'h-7 w-7';
  const iconSize = size === 'sm' ? 10 : 12;
  const textSize = size === 'sm' ? 'text-[9px]' : 'text-2xs';
  const overlap = size === 'sm' ? '-ml-2' : '-ml-2.5';

  const handleToggle = (userId: string) => {
    if (assignees.includes(userId)) {
      onRemove(userId);
    } else {
      onAdd(userId);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled || loading}>
        <button
          type="button"
          className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Stacked avatars - rendered in reverse order for proper overlap */}
          <div className="flex flex-row-reverse items-center">
            {/* Add button (dashed circle) - always last in DOM, first visually */}
            <div
              className={cn(
                dashedSize,
                'rounded-full flex items-center justify-center bg-background hover:bg-muted/50 transition-colors',
                visibleMembers.length > 0 && overlap
              )}
              style={{
                border: '1.5px dashed',
                borderColor: 'hsl(var(--muted-foreground) / 0.5)',
                backgroundImage: 'none',
              }}
            >
              <Plus size={iconSize} className="text-muted-foreground" />
            </div>

            {/* Overflow count badge */}
            {overflowCount > 0 && (
              <div
                className={cn(
                  avatarSize,
                  overlap,
                  'rounded-full bg-muted flex items-center justify-center border-2 border-background'
                )}
              >
                <span className={cn(textSize, 'font-medium text-muted-foreground')}>
                  +{overflowCount}
                </span>
              </div>
            )}

            {/* Visible avatars (reversed for proper stacking) */}
            {[...visibleMembers].reverse().map((member, index) => (
              <Avatar
                key={member.user_id}
                className={cn(
                  avatarSize,
                  'border-2 border-background',
                  index < visibleMembers.length - 1 && overlap
                )}
              >
                <AvatarImage
                  src={member.avatar_url || undefined}
                  alt={member.display_name || ''}
                />
                <AvatarFallback className={textSize}>
                  {getInitials(member.display_name)}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-56 p-1"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-xs font-medium text-muted-foreground px-2 py-1.5">
          Assign team members
        </div>
        <div className="max-h-64 overflow-y-auto">
          {teamMembers.length === 0 ? (
            <div className="px-2 py-4 text-sm text-muted-foreground text-center">
              No team members available
            </div>
          ) : (
            teamMembers.map((member) => {
              const isAssigned = assignees.includes(member.user_id);
              return (
                <button
                  key={member.user_id}
                  type="button"
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm hover:bg-accent transition-colors',
                    isAssigned && 'bg-accent/50'
                  )}
                  onClick={() => handleToggle(member.user_id)}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={member.avatar_url || undefined}
                      alt={member.display_name || ''}
                    />
                    <AvatarFallback className="text-2xs">
                      {getInitials(member.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-left truncate">
                    {member.display_name || 'Team Member'}
                  </span>
                  {isAssigned && (
                    <Check size={16} className="text-primary shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Compact display-only version for read-only contexts
 */
export function LeadAssigneeAvatars({
  assignees,
  teamMembers,
  size = 'sm',
  maxVisible = 2,
}: {
  assignees: string[];
  teamMembers: { user_id: string; display_name: string | null; avatar_url: string | null }[];
  size?: 'sm' | 'xs';
  maxVisible?: number;
}) {
  const assignedMembers = useMemo(() => {
    return assignees
      .map((userId) => teamMembers.find((m) => m.user_id === userId))
      .filter(Boolean) as typeof teamMembers;
  }, [assignees, teamMembers]);

  if (assignedMembers.length === 0) return null;

  const visibleMembers = assignedMembers.slice(0, maxVisible);
  const overflowCount = Math.max(0, assignedMembers.length - maxVisible);

  const avatarSize = size === 'xs' ? 'h-4 w-4' : 'h-5 w-5';
  const textSize = size === 'xs' ? 'text-[8px]' : 'text-2xs';
  const overlap = size === 'xs' ? '-ml-1' : '-ml-1.5';

  return (
    <div className="flex flex-row-reverse items-center">
      {overflowCount > 0 && (
        <div
          className={cn(
            avatarSize,
            overlap,
            'rounded-full bg-muted flex items-center justify-center border border-background'
          )}
        >
          <span className={cn(textSize, 'font-medium text-muted-foreground')}>
            +{overflowCount}
          </span>
        </div>
      )}
      {[...visibleMembers].reverse().map((member, index) => (
        <Avatar
          key={member.user_id}
          className={cn(
            avatarSize,
            'border border-background',
            index < visibleMembers.length - 1 && overlap
          )}
        >
          <AvatarImage
            src={member.avatar_url || undefined}
            alt={member.display_name || ''}
          />
          <AvatarFallback className={textSize}>
            {getInitials(member.display_name)}
          </AvatarFallback>
        </Avatar>
      ))}
    </div>
  );
}
