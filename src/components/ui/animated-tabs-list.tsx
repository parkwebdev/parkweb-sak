/**
 * @fileoverview Animated tabs list with sliding indicator.
 * Uses a sliding indicator on hover for smooth transitions between tabs.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface Tab {
  value: string;
  label: string;
}

interface AnimatedTabsListProps {
  tabs: Tab[];
  activeValue: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export const AnimatedTabsList = React.memo(function AnimatedTabsList({
  tabs,
  activeValue,
  onValueChange,
  className,
}: AnimatedTabsListProps) {
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);
  const [tabDimensions, setTabDimensions] = useState<Record<string, { left: number; width: number }>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Measure tab positions on mount and when tabs change
  useEffect(() => {
    const measureTabs = () => {
      if (!containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const newDimensions: Record<string, { left: number; width: number }> = {};
      
      tabs.forEach(tab => {
        const tabEl = tabRefs.current[tab.value];
        if (tabEl) {
          const tabRect = tabEl.getBoundingClientRect();
          newDimensions[tab.value] = {
            left: tabRect.left - containerRect.left,
            width: tabRect.width,
          };
        }
      });
      
      setTabDimensions(newDimensions);
    };

    measureTabs();
    
    // Re-measure on resize
    window.addEventListener('resize', measureTabs);
    return () => window.removeEventListener('resize', measureTabs);
  }, [tabs]);

  // Determine which tab to show indicator for
  const indicatorValue = hoveredValue ?? activeValue;
  const indicatorDims = tabDimensions[indicatorValue];

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground',
        className
      )}
      onMouseLeave={() => setHoveredValue(null)}
      role="tablist"
    >
      {/* Sliding indicator */}
      {indicatorDims && (
        <motion.div
          className="absolute inset-y-1 rounded-md bg-background shadow-sm"
          initial={false}
          animate={{
            left: indicatorDims.left,
            width: indicatorDims.width,
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 35,
          }}
        />
      )}

      {/* Tab buttons */}
      {tabs.map(tab => (
        <button
          key={tab.value}
          ref={el => { tabRefs.current[tab.value] = el; }}
          type="button"
          role="tab"
          aria-selected={activeValue === tab.value}
          onClick={() => onValueChange?.(tab.value)}
          onMouseEnter={() => setHoveredValue(tab.value)}
          className={cn(
            'relative z-10 inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:pointer-events-none disabled:opacity-50',
            activeValue === tab.value
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
});
