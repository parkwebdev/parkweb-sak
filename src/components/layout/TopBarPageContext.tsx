/**
 * @fileoverview TopBar Page Context Component
 * Left section component displaying page title, icon, and optional menu.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IconButton } from '@/components/ui/icon-button';
import { DotsHorizontal } from '@untitledui/icons';

export interface PageContextMenuItem {
  label: string;
  onClick: () => void;
  icon?: React.ComponentType<{ size: number }>;
  variant?: 'default' | 'destructive';
}

interface TopBarPageContextProps {
  /** Page title */
  title: string;
  /** Optional icon component - accepts any icon with size prop */
  icon?: React.ComponentType<{ size?: number }>;
  /** Optional subtitle/secondary info */
  subtitle?: string;
  /** Optional dropdown menu items */
  menuItems?: PageContextMenuItem[];
  /** Additional className */
  className?: string;
}

/**
 * Page context component for the TopBar left section.
 * Displays an icon, title, optional subtitle, and optional dropdown menu.
 */
export function TopBarPageContext({ 
  title, 
  icon: Icon, 
  subtitle, 
  menuItems,
  className 
}: TopBarPageContextProps) {
  return (
    <div className={cn("flex items-center gap-2 min-w-0", className)}>
      {Icon && (
        <div className="w-6 h-6 rounded bg-muted flex items-center justify-center shrink-0">
          <Icon size={14} aria-hidden="true" />
        </div>
      )}
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="font-medium text-sm truncate">{title}</span>
        {subtitle && (
          <span className="text-xs text-muted-foreground truncate hidden sm:inline">
            — {subtitle}
          </span>
        )}
      </div>
      {menuItems && menuItems.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton 
              label="More options" 
              variant="ghost" 
              size="sm"
              className="shrink-0"
            >
              <DotsHorizontal size={16} aria-hidden="true" />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start" sideOffset={4} className="space-y-0.5">
            {menuItems.map((item, i) => {
              const ItemIcon = item.icon;
              return (
                <DropdownMenuItem 
                  key={i} 
                  onClick={item.onClick}
                  className={cn(
                    "gap-2",
                    item.variant === 'destructive' && "text-destructive focus:text-destructive"
                  )}
                >
                  {ItemIcon && <ItemIcon size={16} aria-hidden="true" />}
                  {item.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
