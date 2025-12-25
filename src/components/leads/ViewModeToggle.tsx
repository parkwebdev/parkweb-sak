/**
 * @fileoverview Animated toggle between Kanban and Table views.
 * Uses a sliding indicator on hover for smooth transitions.
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LayoutAlt04, Rows03 } from '@untitledui/icons';
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
  const [hoveredMode, setHoveredMode] = useState<'kanban' | 'table' | null>(null);
  
  // Determine which position to show the indicator at
  const indicatorPosition = hoveredMode ?? viewMode;

  return (
    <div
      className={cn(
        'relative flex rounded-lg border overflow-hidden',
        className
      )}
      onMouseLeave={() => setHoveredMode(null)}
    >
      {/* Sliding indicator */}
      <motion.div
        className="absolute inset-y-0 w-1/2 bg-muted"
        initial={false}
        animate={{
          x: indicatorPosition === 'kanban' ? 0 : '100%',
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
        onMouseEnter={() => setHoveredMode('kanban')}
        className={cn(
          'relative z-10 flex h-8 w-9 items-center justify-center rounded-md transition-colors',
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
        onMouseEnter={() => setHoveredMode('table')}
        className={cn(
          'relative z-10 flex h-8 w-9 items-center justify-center rounded-md transition-colors',
          viewMode === 'table'
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-label="Table view"
        aria-pressed={viewMode === 'table'}
      >
        <Rows03 className="h-4 w-4" />
      </button>
    </div>
  );
});
