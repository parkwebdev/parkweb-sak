/**
 * PlanActions Component
 * 
 * Context menu for plan management actions.
 * 
 * @module components/admin/plans/PlanActions
 */

import { DotsVertical, Edit02, Trash01 } from '@untitledui/icons';
import { IconButton } from '@/components/ui/icon-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PlanActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Context menu with edit and delete actions for plans.
 */
export function PlanActions({ onEdit, onDelete }: PlanActionsProps) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <IconButton
          label="Plan actions"
          variant="ghost"
          size="sm"
          onClick={(e) => e.stopPropagation()}
        >
          <DotsVertical size={16} aria-hidden="true" />
        </IconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-50">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Edit02 size={14} className="mr-2" aria-hidden="true" />
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
