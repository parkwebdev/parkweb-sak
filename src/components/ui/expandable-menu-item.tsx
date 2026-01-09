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
 * A menu item that reveals additional options in an inline expanded panel on hover.
 * Provides a seamless, non-popup experience for submenu content.
 */
export function ExpandableMenuItem({
  icon,
  label,
  items,
  className,
}: ExpandableMenuItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsExpanded(true);
  }, []);

  const handleMouseLeave = React.useCallback(() => {
    // Small delay to allow moving to submenu
    timeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 100);
  }, []);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('relative', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onPointerEnter={handleMouseEnter}
      onPointerLeave={handleMouseLeave}
    >
      <div
        className={cn(
          'relative flex cursor-default select-none items-center rounded-sm px-2 py-1 text-xs outline-none transition-colors',
          isExpanded ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'
        )}
      >
        {icon && <span className="mr-2 flex-shrink-0">{icon}</span>}
        <span className="flex-1">{label}</span>
        <ChevronRight className="ml-auto h-3 w-3" aria-hidden="true" />
      </div>

      {/* Expanded panel - positioned to the right */}
      {isExpanded && items.length > 0 && (
        <div
          className="absolute left-full top-0 z-[100] ml-1 min-w-[120px] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 slide-in-from-left-1"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onPointerEnter={handleMouseEnter}
          onPointerLeave={handleMouseLeave}
        >
          {items.map((item) => (
            <button
              key={item.id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                item.onClick();
              }}
              className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
