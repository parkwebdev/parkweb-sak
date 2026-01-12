/**
 * TeamMemberActions Component
 * 
 * Action buttons for team member management.
 * 
 * @module components/admin/team/TeamMemberActions
 */

import { IconButton } from '@/components/ui/icon-button';
import { Trash01 } from '@untitledui/icons';

interface TeamMemberActionsProps {
  /** Member ID */
  memberId: string;
  /** Callback when remove is clicked */
  onRemove?: (id: string) => void;
}

/**
 * Team member actions component.
 */
export function TeamMemberActions({ memberId, onRemove }: TeamMemberActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {onRemove && (
        <IconButton label="Remove team member" variant="ghost" size="sm" onClick={() => onRemove(memberId)}>
          <Trash01 size={14} className="text-destructive" />
        </IconButton>
      )}
    </div>
  );
}
