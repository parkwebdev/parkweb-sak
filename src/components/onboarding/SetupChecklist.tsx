/**
 * Setup Checklist Component
 * 
 * Borderless container for the onboarding steps.
 * Matches Intercom's minimal list style.
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

      <div>
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
    </div>
  );
};
