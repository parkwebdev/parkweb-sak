/**
 * RowActions Component
 * 
 * Stripe-inspired row actions with hover quick icons + dropdown menu.
 * 
 * Features:
 * - Quick action icons appear on row hover (edit, delete, etc.)
 * - Horizontal dots trigger full dropdown menu
 * - Tooltips on quick action hover
 * - Consistent styling across all tables
 * 
 * @module components/ui/row-actions
 */

import * as React from 'react';
import { DotsHorizontal } from '@untitledui/icons';
import { IconButton } from './icon-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './tooltip';
import { cn } from '@/lib/utils';

export interface QuickAction {
  /** Icon component from @untitledui/icons */
  icon: React.ComponentType<{ size?: number; className?: string }>;
  /** Accessible label for the button (used in aria-label and tooltip) */
  label: string;
  /** Click handler */
  onClick: (e: React.MouseEvent) => void;
  /** Visual variant - destructive shows different hover color */
  variant?: 'default' | 'destructive';
  /** Whether to show this action */
  show?: boolean;
}

export interface RowActionsProps {
  /** Quick action icons shown on row hover */
  quickActions?: QuickAction[];
  /** Content for the full dropdown menu */
  menuContent: React.ReactNode;
  /** Additional className for the container */
  className?: string;
  /** Menu alignment - defaults to 'end' */
  menuAlign?: 'start' | 'center' | 'end';
}

/**
 * Row actions component with hover quick icons and dropdown menu.
 * 
 * @example
 * ```tsx
 * <RowActions
 *   quickActions={[
 *     { icon: Eye, label: "View", onClick: handleView },
 *     { icon: Trash01, label: "Delete", onClick: handleDelete, variant: "destructive" },
 *   ]}
 *   menuContent={
 *     <>
 *       <DropdownMenuItem onClick={handleView}>
 *         <Eye size={14} className="mr-2" />
 *         View Details
 *       </DropdownMenuItem>
 *       <DropdownMenuItem onClick={handleDelete} className="text-destructive">
 *         <Trash01 size={14} className="mr-2" />
 *         Delete
 *       </DropdownMenuItem>
 *     </>
 *   }
 * />
 * ```
 */
export function RowActions({
  quickActions = [],
  menuContent,
  className,
  menuAlign = 'end',
}: RowActionsProps) {
  // Filter to only visible actions
  const visibleActions = quickActions.filter(action => action.show !== false);

  return (
    <div 
      className={cn("flex items-center justify-end gap-0.5", className)}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Quick actions - visible on row hover */}
      {visibleActions.length > 0 && (
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {visibleActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <IconButton
                    variant="ghost"
                    size="icon-sm"
                    label={action.label}
                    onClick={action.onClick}
                    className={cn(
                      "h-7 w-7",
                      action.variant === 'destructive' && "hover:text-destructive hover:bg-destructive/10"
                    )}
                  >
                    <Icon size={14} aria-hidden="true" />
                  </IconButton>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {action.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      )}

      {/* Full menu trigger - always visible */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <IconButton
            variant="ghost"
            size="icon-sm"
            label="More actions"
            className="h-7 w-7"
          >
            <DotsHorizontal size={16} aria-hidden="true" />
          </IconButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={menuAlign} className="min-w-[160px]">
          <DropdownMenuLabel className="text-2xs text-muted-foreground uppercase tracking-wider font-medium">
            Actions
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {menuContent}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
