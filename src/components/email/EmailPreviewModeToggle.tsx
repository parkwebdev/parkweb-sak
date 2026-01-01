/**
 * @fileoverview Segmented toggle for email preview modes.
 * Uses a sliding indicator for smooth transitions between Preview, Source, and Supabase modes.
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Eye, Code01, Database01 } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type EmailPreviewMode = 'preview' | 'source' | 'supabase';

interface EmailPreviewModeToggleProps {
  mode: EmailPreviewMode;
  onModeChange: (mode: EmailPreviewMode) => void;
  showSupabaseOption?: boolean;
  className?: string;
}

const MODE_OPTIONS = [
  { id: 'preview' as const, label: 'Preview', icon: Eye },
  { id: 'source' as const, label: 'Source', icon: Code01 },
  { id: 'supabase' as const, label: 'Supabase', icon: Database01 },
];

export const EmailPreviewModeToggle = React.memo(function EmailPreviewModeToggle({
  mode,
  onModeChange,
  showSupabaseOption = false,
  className,
}: EmailPreviewModeToggleProps) {
  const [hoveredMode, setHoveredMode] = useState<EmailPreviewMode | null>(null);
  
  const visibleOptions = showSupabaseOption 
    ? MODE_OPTIONS 
    : MODE_OPTIONS.filter(opt => opt.id !== 'supabase');
  
  const indicatorPosition = hoveredMode ?? mode;
  const currentIndex = visibleOptions.findIndex(opt => opt.id === indicatorPosition);
  const itemWidth = 100 / visibleOptions.length;

  return (
    <div
      className={cn(
        'relative flex rounded-lg border bg-muted/30 overflow-hidden',
        className
      )}
      onMouseLeave={() => setHoveredMode(null)}
    >
      {/* Sliding indicator */}
      <motion.div
        className="absolute inset-y-0 bg-background border rounded-md shadow-sm"
        style={{ width: `${itemWidth}%` }}
        initial={false}
        animate={{
          x: `${currentIndex * 100}%`,
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 35,
        }}
      />

      {visibleOptions.map((option) => {
        const Icon = option.icon;
        const isActive = mode === option.id;
        
        return (
          <Tooltip key={option.id}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onModeChange(option.id)}
                onMouseEnter={() => setHoveredMode(option.id)}
                className={cn(
                  'relative z-10 flex h-8 items-center justify-center gap-1.5 px-3 rounded-md transition-colors text-sm',
                  isActive
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                style={{ width: `${itemWidth}%` }}
                aria-label={option.label}
                aria-pressed={isActive}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{option.label}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{option.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
});
