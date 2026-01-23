/**
 * PilotTeamActions Component
 * 
 * Dropdown menu for pilot team member management actions.
 * 
 * @module components/admin/team/PilotTeamActions
 */

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IconButton } from '@/components/ui/icon-button';
import { DotsVertical, Settings01, Trash01 } from '@untitledui/icons';
import type { PilotTeamMember } from '@/types/admin';

interface PilotTeamActionsProps {
  member: PilotTeamMember;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onRemove: () => void;
}

/**
 * Dropdown menu for pilot team member actions.
 */
export function PilotTeamActions({ 
  member, 
  canEdit, 
  canDelete, 
  onEdit, 
  onRemove 
}: PilotTeamActionsProps) {
  if (!canEdit && !canDelete) {
    return null;
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <IconButton
          variant="ghost"
          size="sm"
          label="Team member actions"
          onClick={(e) => e.stopPropagation()}
        >
          <DotsVertical size={16} aria-hidden="true" />
        </IconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canEdit && (
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            <Settings01 size={14} className="mr-2" aria-hidden="true" />
            Manage Permissions
          </DropdownMenuItem>
        )}
        {canEdit && canDelete && <DropdownMenuSeparator />}
        {canDelete && (
          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="text-destructive focus:text-destructive"
          >
            <Trash01 size={14} className="mr-2" aria-hidden="true" />
            Remove Member
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
