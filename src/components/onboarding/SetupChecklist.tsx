/**
 * Setup Checklist Component
 * 
 * Container for the onboarding step cards with progress tracking.
 * Manages which step is expanded and handles step interactions.
 * 
 * @module components/onboarding/SetupChecklist
 */

import React, { useState, useEffect } from 'react';
import { SetupProgress } from './SetupProgress';
import { SetupStepCard } from './SetupStepCard';
import type { OnboardingStep } from '@/hooks/useOnboardingProgress';

interface SetupChecklistProps {
  steps: OnboardingStep[];
  completedCount: number;
  totalCount: number;
  percentComplete: number;
  onStepAction: (step: OnboardingStep) => void;
  onStepHover?: (step: OnboardingStep | null) => void;
  selectedStepId?: string | null;
}

export const SetupChecklist: React.FC<SetupChecklistProps> = ({
  steps,
  completedCount,
  totalCount,
  percentComplete,
  onStepAction,
  onStepHover,
  selectedStepId,
}) => {
  // Track which step is expanded - default to first incomplete step
  const [expandedStepId, setExpandedStepId] = useState<string | null>(() => {
    const firstIncomplete = steps.find(s => !s.isComplete);
    return firstIncomplete?.id || steps[0]?.id || null;
  });

  // Update expanded step when steps change (e.g., a step becomes complete)
  useEffect(() => {
    // If currently expanded step becomes complete, move to next incomplete
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
    onStepHover?.(step);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-6">
      <SetupProgress
        completedCount={completedCount}
        totalCount={totalCount}
        percentComplete={percentComplete}
      />

      <div className="space-y-3">
        {steps.map((step, index) => (
          <SetupStepCard
            key={step.id}
            step={step}
            stepNumber={index + 1}
            isExpanded={expandedStepId === step.id}
            isCurrent={!step.isComplete && steps.findIndex(s => !s.isComplete) === index}
            onClick={() => handleStepClick(step)}
            onAction={() => onStepAction(step)}
          />
        ))}
      </div>
    </div>
  );
};
