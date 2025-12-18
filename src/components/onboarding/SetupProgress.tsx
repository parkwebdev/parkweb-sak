/**
 * Setup Progress Component
 * 
 * Displays progress bar and step count for onboarding checklist.
 * 
 * @module components/onboarding/SetupProgress
 */

import React from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface SetupProgressProps {
  completedCount: number;
  totalCount: number;
  percentComplete: number;
}

export const SetupProgress: React.FC<SetupProgressProps> = ({
  completedCount,
  totalCount,
  percentComplete,
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Get set up</h2>
        <span className="text-sm text-muted-foreground">
          {completedCount} of {totalCount} steps complete
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentComplete}%` }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};
