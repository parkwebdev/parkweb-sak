/**
 * @fileoverview Global Top Bar Component
 * A thin, static header bar with three sections: left (page context), 
 * center (navigation tabs), and right (action buttons).
 * 
 * Height: 48px (h-12)
 * Styling: bg-background border-b border-border
 */

import React, { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Menu01 as Menu } from '@untitledui/icons';

interface TopBarProps {
  /** Left section - page context/entity indicator */
  left?: ReactNode;
  /** Center section - tabs/navigation */
  center?: ReactNode;
  /** Right section - action buttons */
  right?: ReactNode;
  /** Callback for mobile menu button click */
  onMobileMenuClick?: () => void;
  /** Additional className for the container */
  className?: string;
}

/**
 * Global top bar component with three-section layout.
 * Integrates with TopBarContext for dynamic content per page.
 */
export function TopBar({ 
  left, 
  center, 
  right, 
  onMobileMenuClick,
  className 
}: TopBarProps) {
  return (
    <header 
      className={cn(
        "h-12 border-b border-border bg-background flex items-center px-4 gap-4 shrink-0",
        className
      )}
    >
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        aria-label="Open navigation menu"
        onClick={onMobileMenuClick}
        className="lg:hidden -ml-2"
      >
        <Menu size={18} aria-hidden="true" />
      </Button>

      {/* Left section - page context */}
      <div className="flex items-center gap-2 min-w-0 shrink-0">
        {left}
      </div>
      
      {/* Center section - flexible, centered tabs */}
      <div className="flex-1 flex items-center justify-center min-w-0 overflow-hidden">
        {center}
      </div>
      
      {/* Right section - action buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {right}
      </div>
    </header>
  );
}

// Re-export related components for convenience
export { TopBarTabs, type TopBarTab } from './TopBarTabs';
export { TopBarPageContext, type PageContextMenuItem } from './TopBarPageContext';
export { TopBarProvider, useTopBar, useTopBarContext, type TopBarConfig } from './TopBarContext';
export { TopBarSearch } from './TopBarSearch';
export { TopBarSearchResultItem, TopBarSearchEmptyState } from './TopBarSearchResultItem';

// Re-export skeleton components for convenience
export { 
  SkeletonTopBar,
  SkeletonTopBarPageContext,
  SkeletonTopBarTabs,
  SkeletonTopBarSearch,
  SkeletonTopBarActions,
} from '@/components/ui/skeleton';
