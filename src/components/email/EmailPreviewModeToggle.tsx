/**
 * @fileoverview Segmented toggle for email preview modes.
 * Uses a sliding indicator for smooth transitions between Preview, Source, and Supabase modes.
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Eye, Code01 } from '@untitledui/icons';
import { cn } from '@/lib/utils';

export type EmailPreviewMode = 'preview' | 'source' | 'supabase';

interface EmailPreviewModeToggleProps {
  mode: EmailPreviewMode;
  onModeChange: (mode: EmailPreviewMode) => void;
  showSupabaseOption?: boolean;
  className?: string;
}

/** Supabase brand icon */
function SupabaseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 109 113" fill="none" className={className}>
      <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="url(#supabase__paint0_linear)"/>
      <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="url(#supabase__paint1_linear)" fillOpacity="0.2"/>
      <path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z" fill="#3ECF8E"/>
      <defs>
        <linearGradient id="supabase__paint0_linear" x1="53.9738" y1="54.974" x2="94.1635" y2="71.8295" gradientUnits="userSpaceOnUse">
          <stop stopColor="#249361"/>
          <stop offset="1" stopColor="#3ECF8E"/>
        </linearGradient>
        <linearGradient id="supabase__paint1_linear" x1="36.1558" y1="30.578" x2="54.4844" y2="65.0806" gradientUnits="userSpaceOnUse">
          <stop/>
          <stop offset="1" stopOpacity="0"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

const MODE_OPTIONS = [
  { id: 'preview' as const, label: 'Preview', icon: Eye },
  { id: 'source' as const, label: 'Source', icon: Code01 },
  { id: 'supabase' as const, label: 'Supabase', icon: null }, // Uses custom icon
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
  const optionCount = visibleOptions.length;

  const itemWidth = 100 / optionCount;

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
        className="absolute inset-y-0 bg-muted"
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
          <button
            key={option.id}
            type="button"
            onClick={() => onModeChange(option.id)}
            onMouseEnter={() => setHoveredMode(option.id)}
            className={cn(
              'relative z-10 flex h-8 items-center justify-center gap-1.5 px-3 transition-colors text-sm',
              isActive
                ? 'text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground'
            )}
            style={{ width: `${itemWidth}%` }}
            aria-label={option.label}
            aria-pressed={isActive}
          >
            {option.id === 'supabase' ? (
              <SupabaseIcon className="h-6 w-6 scale-150" />
            ) : Icon ? (
              <Icon size={16} />
            ) : null}
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
});
