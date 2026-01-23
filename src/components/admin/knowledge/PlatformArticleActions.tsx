/**
 * PlatformArticleActions Component
 * 
 * Dropdown menu for platform help article management actions.
 * 
 * @module components/admin/knowledge/PlatformArticleActions
 */

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IconButton } from '@/components/ui/icon-button';
import { DotsVertical, Trash01 } from '@untitledui/icons';

interface PlatformArticleActionsProps {
  onDelete: () => void;
}

/**
 * Dropdown menu for platform article actions.
 */
export function PlatformArticleActions({ onDelete }: PlatformArticleActionsProps) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <IconButton
          variant="ghost"
          size="sm"
          label="Article actions"
          onClick={(e) => e.stopPropagation()}
        >
          <DotsVertical size={16} aria-hidden="true" />
        </IconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="text-destructive focus:text-destructive"
        >
          <Trash01 size={14} className="mr-2" aria-hidden="true" />
          Delete Article
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
