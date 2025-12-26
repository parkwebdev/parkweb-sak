/**
 * Setup Progress Component
 * 
 * Displays inline progress with circular indicator for onboarding checklist.
 * Matches Intercom's minimal "○ Get set up • 0 / 5 steps" style.
 * 
 * @module components/onboarding/SetupProgress
 */

import React from 'react';

interface SetupProgressProps {
  completedCount: number;
  totalCount: number;
}

export function SetupProgress({
  completedCount,
  totalCount,
}: SetupProgressProps) {
  const isAllComplete = completedCount === totalCount;
  const progress = totalCount > 0 ? (completedCount / totalCount) : 0;
  const circumference = 2 * Math.PI * 6; // radius = 6
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex items-center gap-2 text-sm">
      <svg width="16" height="16" viewBox="0 0 16 16" className="flex-shrink-0">
        {/* Background circle */}
        <circle
          cx="8"
          cy="8"
          r="6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-muted-foreground/30"
        />
        {/* Progress circle */}
        <circle
          cx="8"
          cy="8"
          r="6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-status-active"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 8 8)"
          style={{ transition: 'stroke-dashoffset 0.3s ease' }}
        />
        {/* Checkmark when complete */}
        {isAllComplete && (
          <path
            d="M5 8l2 2 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-status-active"
          />
        )}
      </svg>
      <span className="font-medium text-foreground">Get set up</span>
      <span className="text-muted-foreground">•</span>
      <span className="text-muted-foreground">
        {completedCount} / {totalCount} steps
      </span>
    </div>
  );
};
