/**
 * PlatformArticleActions Component
 * 
 * Dropdown menu for platform help article management actions with hover quick actions.
 * 
 * @module components/admin/knowledge/PlatformArticleActions
 */

import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { RowActions, type QuickAction } from '@/components/ui/row-actions';
import { Trash01 } from '@untitledui/icons';

interface PlatformArticleActionsProps {
  onDelete: () => void;
}

/**
 * Dropdown menu for platform article actions.
 */
export function PlatformArticleActions({ onDelete }: PlatformArticleActionsProps) {
  // Quick actions shown on hover
  const quickActions: QuickAction[] = [
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
        <DropdownMenuItem
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="text-destructive focus:text-destructive"
        >
          <Trash01 size={14} className="mr-2" aria-hidden="true" />
          Delete Article
        </DropdownMenuItem>
      }
    />
  );
}
