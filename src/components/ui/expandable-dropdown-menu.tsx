/**
 * Expandable Dropdown Menu Component
 * 
 * A dropdown menu that can expand inline to show additional options,
 * similar to the sidebar shortcuts pattern. The menu grows in width
 * to reveal a connected side panel rather than spawning a separate popup.
 * 
 * @module components/ui/expandable-dropdown-menu
 */

import * as React from 'react';
import { ChevronRight } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ExpandableItem {
  id: string;
  label: string;
  onClick: () => void;
}

interface ExpandableDropdownMenuProps {
  /** The trigger element */
  trigger: React.ReactNode;
  /** Main menu items */
  mainItems: {
    id: string;
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  }[];
  /** Expandable submenu configuration */
  expandableItem?: {
    id: string;
    label: string;
    icon?: React.ReactNode;
    items: ExpandableItem[];
  };
  /** Alignment of the dropdown */
  align?: 'start' | 'center' | 'end';
  /** Additional class names for the content */
  className?: string;
}

/**
 * A dropdown menu that expands inline to show a connected side panel on hover.
 * Provides a seamless, unified menu experience like the sidebar shortcuts.
 */
export function ExpandableDropdownMenu({
  trigger,
  mainItems,
  expandableItem,
  align = 'end',
  className,
}: ExpandableDropdownMenuProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const timeoutRef = React.useRef<number | null>(null);

  const cancelClose = React.useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const scheduleClose = React.useCallback(() => {
    cancelClose();
    timeoutRef.current = window.setTimeout(() => setIsExpanded(false), 150);
  }, [cancelClose]);

  const handleExpandEnter = React.useCallback(() => {
    cancelClose();
    setIsExpanded(true);
  }, [cancelClose]);

  const handleExpandLeave = React.useCallback(() => {
    scheduleClose();
  }, [scheduleClose]);

  // Reset on menu close
  const handleOpenChange = React.useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setIsExpanded(false);
      cancelClose();
    }
  }, [cancelClose]);

  React.useEffect(() => {
    return () => cancelClose();
  }, [cancelClose]);

  const hasExpandable = expandableItem && expandableItem.items.length > 0;

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className={cn(
          'p-0 transition-all duration-200 ease-out overflow-visible w-auto',
          className
        )}
      >
        <div className="flex">
          {/* Main menu column */}
          <div className="flex-shrink-0 py-1 min-w-[140px]">
            {mainItems.map((item) => (
              <DropdownMenuItem
                key={item.id}
                onClick={item.onClick}
                className="mx-1 whitespace-nowrap"
              >
                {item.icon && <span className="mr-2 flex-shrink-0">{item.icon}</span>}
                {item.label}
              </DropdownMenuItem>
            ))}

            {hasExpandable && (
              <>
                <DropdownMenuSeparator className="my-1" />
                <div
                  className={cn(
                    'relative flex cursor-default select-none items-center rounded-sm px-2 py-1 mx-1 text-xs outline-none transition-colors whitespace-nowrap',
                    isExpanded ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'
                  )}
                  onMouseEnter={handleExpandEnter}
                  onMouseMove={handleExpandEnter}
                  onPointerEnter={handleExpandEnter}
                  onPointerMove={handleExpandEnter}
                  onMouseLeave={handleExpandLeave}
                  onPointerLeave={handleExpandLeave}
                >
                  {expandableItem.icon && <span className="mr-2 flex-shrink-0">{expandableItem.icon}</span>}
                  <span className="flex-1">{expandableItem.label}</span>
                  <ChevronRight className="ml-2 h-3 w-3 flex-shrink-0" aria-hidden="true" />

                  {/* Expanded column - positioned relative to this row */}
                  {isExpanded && (
                    <div
                      className="absolute left-full top-0 border-l border-border py-1 min-w-[100px] bg-popover rounded-r-md animate-in fade-in-0 slide-in-from-left-1 duration-150"
                      onMouseEnter={handleExpandEnter}
                      onMouseMove={handleExpandEnter}
                      onPointerEnter={handleExpandEnter}
                      onPointerMove={handleExpandEnter}
                      onMouseLeave={handleExpandLeave}
                      onPointerLeave={handleExpandLeave}
                    >
                      {expandableItem.items.map((subItem) => (
                        <button
                          key={subItem.id}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsOpen(false);
                            subItem.onClick();
                          }}
                          className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1 mx-1 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground whitespace-nowrap"
                          style={{ width: 'calc(100% - 8px)' }}
                        >
                          {subItem.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
