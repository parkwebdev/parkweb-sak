/**
 * Setup Progress Component
 * 
 * Displays inline progress text for onboarding checklist.
 * Matches Intercom's minimal "○ Get set up • 0 / 5 steps" style.
 * 
 * @module components/onboarding/SetupProgress
 */

import React from 'react';

interface SetupProgressProps {
  completedCount: number;
  totalCount: number;
}

export const SetupProgress: React.FC<SetupProgressProps> = ({
  completedCount,
  totalCount,
}) => {
  const isAllComplete = completedCount === totalCount;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={isAllComplete ? 'text-status-active' : 'text-muted-foreground'}>
        {isAllComplete ? '●' : '○'}
      </span>
      <span className="font-medium text-foreground">Get set up</span>
      <span className="text-muted-foreground">•</span>
      <span className="text-muted-foreground">
        {completedCount} / {totalCount} steps
      </span>
    </div>
  );
};
