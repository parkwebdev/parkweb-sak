/**
 * TeamMemberActions Component
 * 
 * Action buttons for team member management.
 * 
 * @module components/admin/team/TeamMemberActions
 */

import { Button } from '@/components/ui/button';
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
        <Button variant="ghost" size="sm" onClick={() => onRemove(memberId)}>
          <Trash01 size={14} className="text-destructive" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
