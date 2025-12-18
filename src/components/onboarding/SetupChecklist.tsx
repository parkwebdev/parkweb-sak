/**
 * Setup Checklist Component
 * 
 * Two-column layout: steps on left, video preview on right.
 * Matches Intercom's onboarding style.
 * 
 * @module components/onboarding/SetupChecklist
 */

import React, { useState, useEffect } from 'react';
import { SetupProgress } from './SetupProgress';
import { SetupStepCard } from './SetupStepCard';
import { VideoPlaceholder } from './VideoPlaceholder';
import type { OnboardingStep } from '@/hooks/useOnboardingProgress';

interface SetupChecklistProps {
  steps: OnboardingStep[];
  completedCount: number;
  totalCount: number;
  onStepAction: (step: OnboardingStep) => void;
}

export const SetupChecklist: React.FC<SetupChecklistProps> = ({
  steps,
  completedCount,
  totalCount,
  onStepAction,
}) => {
  // Track which step is expanded - default to first incomplete step
  const [expandedStepId, setExpandedStepId] = useState<string | null>(() => {
    const firstIncomplete = steps.find(s => !s.isComplete);
    return firstIncomplete?.id || steps[0]?.id || null;
  });

  // Update expanded step when steps change (e.g., a step becomes complete)
  useEffect(() => {
    const currentStep = steps.find(s => s.id === expandedStepId);
    if (currentStep?.isComplete) {
      const nextIncomplete = steps.find(s => !s.isComplete);
      if (nextIncomplete) {
        setExpandedStepId(nextIncomplete.id);
      }
    }
  }, [steps, expandedStepId]);

  const handleStepClick = (step: OnboardingStep) => {
    setExpandedStepId(prev => prev === step.id ? null : step.id);
  };

  return (
    <div className="space-y-4">
      <SetupProgress
        completedCount={completedCount}
        totalCount={totalCount}
      />

      {/* Two-column layout: steps left, video right */}
      <div className="flex gap-6">
        {/* Left column: Step list */}
        <div className="flex-1 min-w-0">
          {steps.map((step) => (
            <SetupStepCard
              key={step.id}
              step={step}
              isExpanded={expandedStepId === step.id}
              onClick={() => handleStepClick(step)}
              onAction={() => onStepAction(step)}
            />
          ))}
        </div>

        {/* Right column: Video placeholder spanning full height */}
        <div className="hidden sm:flex w-56 md:w-64 lg:w-72 flex-shrink-0">
          <VideoPlaceholder stepId={expandedStepId || steps[0]?.id} />
        </div>
      </div>
    </div>
  );
};
