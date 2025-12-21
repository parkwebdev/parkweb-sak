/**
 * Setup Progress Component
 * 
 * Displays inline progress with enhanced circular indicator for onboarding checklist.
 * Features a larger progress ring with subtle animation.
 * 
 * @module components/onboarding/SetupProgress
 */

import React from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface SetupProgressProps {
  completedCount: number;
  totalCount: number;
}

export const SetupProgress: React.FC<SetupProgressProps> = ({
  completedCount,
  totalCount,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const isAllComplete = completedCount === totalCount;
  const progress = totalCount > 0 ? (completedCount / totalCount) : 0;
  const radius = 18;
  const strokeWidth = 3;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex items-center gap-4">
      {/* Enhanced progress ring */}
      <div className="relative">
        <svg width="48" height="48" viewBox="0 0 48 48" className="flex-shrink-0">
          {/* Background circle with subtle glow */}
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted-foreground/20"
          />
          {/* Progress circle */}
          <motion.circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="text-primary"
            strokeDasharray={circumference}
            initial={prefersReducedMotion ? { strokeDashoffset } : { strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            transform="rotate(-90 24 24)"
          />
          {/* Checkmark when complete */}
          {isAllComplete && (
            <motion.path
              d="M16 24l5 5 11-11"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
              initial={prefersReducedMotion ? {} : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            />
          )}
        </svg>
        {/* Subtle pulse animation when incomplete */}
        {!isAllComplete && !prefersReducedMotion && (
          <div className="absolute inset-0 rounded-full animate-slow-pulse">
            <div className="w-full h-full rounded-full border-2 border-primary/20" />
          </div>
        )}
      </div>

      {/* Text content */}
      <div className="flex flex-col">
        <span className="font-semibold text-foreground">Get set up</span>
        <span className="text-sm text-muted-foreground">
          {completedCount} of {totalCount} steps complete
        </span>
      </div>
    </div>
  );
};
