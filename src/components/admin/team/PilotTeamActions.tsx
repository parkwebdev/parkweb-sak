/**
 * PilotTeamActions Component
 * 
 * Dropdown menu for pilot team member management actions with hover quick actions.
 * 
 * @module components/admin/team/PilotTeamActions
 */

import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { RowActions, type QuickAction } from '@/components/ui/row-actions';
import { Settings01, Trash01 } from '@untitledui/icons';
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

  // Quick actions shown on hover
  const quickActions: QuickAction[] = [
    {
      icon: Settings01,
      label: 'Manage Permissions',
      onClick: (e) => { e.stopPropagation(); onEdit(); },
      show: canEdit,
    },
    {
      icon: Trash01,
      label: 'Remove',
      onClick: (e) => { e.stopPropagation(); onRemove(); },
      variant: 'destructive',
      show: canDelete,
    },
  ];

  return (
    <RowActions
      quickActions={quickActions}
      menuContent={
        <>
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
        </>
      }
    />
  );
}
