/**
 * PlanActions Component
 * 
 * Context menu for plan management actions with hover quick actions.
 * 
 * @module components/admin/plans/PlanActions
 */

import { Edit05, Trash01 } from '@untitledui/icons';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { RowActions, type QuickAction } from '@/components/ui/row-actions';

interface PlanActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Context menu with edit and delete actions for plans.
 */
export function PlanActions({ onEdit, onDelete }: PlanActionsProps) {
  // Quick actions shown on hover
  const quickActions: QuickAction[] = [
    {
      icon: Edit05,
      label: 'Edit',
      onClick: (e) => { e.stopPropagation(); onEdit(); },
    },
    {
      icon: Trash01,
      label: 'Delete',
      onClick: (e) => { e.stopPropagation(); onDelete(); },
      variant: 'destructive',
    },
  ];

  return (
    <RowActions
      quickActions={quickActions}
      menuContent={
        <>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Edit05 size={14} className="mr-2" aria-hidden="true" />
            Edit Plan
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-destructive focus:text-destructive"
          >
            <Trash01 size={14} className="mr-2" aria-hidden="true" />
            Delete Plan
          </DropdownMenuItem>
        </>
      }
    />
  );
}
