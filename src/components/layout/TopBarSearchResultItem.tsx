/**
 * @fileoverview Reusable Search Result Item Component
 * 
 * Consistent styling for search result items in TopBarSearch dropdown.
 * 
 * @module components/layout/TopBarSearchResultItem
 */

import React, { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useTopBarSearchResults } from './TopBarSearch';

interface TopBarSearchResultItemProps {
  /** Optional icon element */
  icon?: ReactNode;
  /** Main title text */
  title: string;
  /** Optional subtitle/secondary text */
  subtitle?: string;
  /** Optional status indicator (e.g., colored dot) */
  statusIndicator?: ReactNode;
  /** Click handler - will also close the popover */
  onClick: () => void;
  /** Additional className */
  className?: string;
}

/**
 * Reusable result item for TopBarSearch dropdown.
 * Automatically closes the search popover when clicked.
 */
export function TopBarSearchResultItem({
  icon,
  title,
  subtitle,
  statusIndicator,
  onClick,
  className,
}: TopBarSearchResultItemProps) {
  const searchContext = useTopBarSearchResults();

  const handleClick = () => {
    onClick();
    searchContext?.onResultClick();
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full p-3 text-left hover:bg-accent flex items-start gap-3 border-b last:border-b-0 transition-colors",
        className
      )}
      type="button"
    >
      {icon && (
        <span className="flex-shrink-0 text-muted-foreground mt-0.5">
          {icon}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate text-foreground">
          {title}
        </div>
        {subtitle && (
          <div className="text-xs text-muted-foreground truncate mt-0.5">
            {subtitle}
          </div>
        )}
      </div>
      {statusIndicator && (
        <span className="flex-shrink-0 mt-1.5">
          {statusIndicator}
        </span>
      )}
    </button>
  );
}

/**
 * Empty state component for search results
 */
export function TopBarSearchEmptyState({ message = 'No results found' }: { message?: string }) {
  return (
    <div className="p-4 text-center text-muted-foreground text-sm">
      {message}
    </div>
  );
}
