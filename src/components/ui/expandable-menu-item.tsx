/**
 * Expandable Menu Item Component
 * 
 * A menu item that expands inline to show additional options on hover,
 * similar to the sidebar shortcuts pattern. Used for seamless submenu
 * expansion in dropdown menus and context menus.
 * 
 * @module components/ui/expandable-menu-item
 */

import * as React from 'react';
import { ChevronRight } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ExpandableMenuItemProps {
  /** Icon to display before the label */
  icon?: React.ReactNode;
  /** Label text for the menu item */
  label: string;
  /** Items to show when expanded */
  items: { id: string; label: string; onClick: () => void }[];
  /** Additional class names */
  className?: string;
}

/**
 * A menu item that reveals additional options in a seamless inline panel on hover.
 * Uses a Popover Portal so it won't get clipped by Radix menu content.
 */
export function ExpandableMenuItem({
  icon,
  label,
  items,
  className,
}: ExpandableMenuItemProps) {
  const [open, setOpen] = React.useState(false);
  const timeoutRef = React.useRef<number | null>(null);

  const cancelClose = React.useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const scheduleClose = React.useCallback(() => {
    cancelClose();
    timeoutRef.current = window.setTimeout(() => setOpen(false), 120);
  }, [cancelClose]);

  const handleEnter = React.useCallback(() => {
    cancelClose();
    setOpen(true);
  }, [cancelClose]);

  const handleLeave = React.useCallback(() => {
    scheduleClose();
  }, [scheduleClose]);

  React.useEffect(() => {
    return () => cancelClose();
  }, [cancelClose]);

  if (items.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn('relative', className)}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          onMouseMove={handleEnter}
          onPointerEnter={handleEnter}
          onPointerLeave={handleLeave}
          onPointerMove={handleEnter}
        >
          <div
            className={cn(
              'relative flex cursor-default select-none items-center rounded-sm px-2 py-1 text-xs outline-none transition-colors',
              open ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {icon && <span className="mr-2 flex-shrink-0">{icon}</span>}
            <span className="flex-1">{label}</span>
            <ChevronRight className="ml-auto h-3 w-3" aria-hidden="true" />
          </div>
        </div>
      </PopoverTrigger>

      <PopoverContent
        side="right"
        align="start"
        sideOffset={6}
        className={cn(
          'z-[100] w-auto min-w-[140px] p-1',
          // override base popover defaults that are too "card-like" for menus
          'rounded-md border bg-popover text-popover-foreground shadow-md'
        )}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onMouseMove={handleEnter}
        onPointerEnter={handleEnter}
        onPointerLeave={handleLeave}
        onPointerMove={handleEnter}
      >
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
              item.onClick();
            }}
            className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          >
            {item.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
