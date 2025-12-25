/**
 * @fileoverview Animated toggle between Kanban and Table views.
 * Uses a sliding indicator for smooth transitions.
 */

import React from 'react';
import { motion } from 'motion/react';
import { LayoutAlt04, List } from '@untitledui/icons';
import { cn } from '@/lib/utils';

interface ViewModeToggleProps {
  viewMode: 'kanban' | 'table';
  onViewModeChange: (mode: 'kanban' | 'table') => void;
  className?: string;
}

export const ViewModeToggle = React.memo(function ViewModeToggle({
  viewMode,
  onViewModeChange,
  className,
}: ViewModeToggleProps) {
  return (
    <div
      className={cn(
        'relative flex rounded-lg border bg-muted/50 p-0.5',
        className
      )}
    >
      {/* Sliding indicator */}
      <motion.div
        className="absolute inset-y-0.5 w-[calc(50%-2px)] rounded-md bg-background shadow-sm"
        initial={false}
        animate={{
          x: viewMode === 'kanban' ? 2 : 'calc(100% + 2px)',
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 35,
        }}
      />

      {/* Kanban button */}
      <button
        type="button"
        onClick={() => onViewModeChange('kanban')}
        className={cn(
          'relative z-10 flex h-7 w-8 items-center justify-center rounded-md transition-colors',
          viewMode === 'kanban'
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-label="Kanban view"
        aria-pressed={viewMode === 'kanban'}
      >
        <LayoutAlt04 className="h-4 w-4" />
      </button>

      {/* Table button */}
      <button
        type="button"
        onClick={() => onViewModeChange('table')}
        className={cn(
          'relative z-10 flex h-7 w-8 items-center justify-center rounded-md transition-colors',
          viewMode === 'table'
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-label="Table view"
        aria-pressed={viewMode === 'table'}
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
});
