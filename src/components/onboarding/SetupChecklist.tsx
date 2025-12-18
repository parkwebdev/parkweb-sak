/**
 * Setup Checklist Component
 * 
 * Two-column layout: steps on left, video preview on right.
 * Matches Intercom's onboarding style.
 * 
 * @module components/onboarding/SetupChecklist
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, ArrowUpRight } from '@untitledui/icons';
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
  const allComplete = completedCount === totalCount;
  
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

  // All complete state
  if (allComplete) {
    return (
      <div className="space-y-4">
        <SetupProgress
          completedCount={completedCount}
          totalCount={totalCount}
        />

        <div className="border border-border rounded-xl bg-card shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-status-active/10 flex items-center justify-center">
              <CheckCircle size={18} className="text-status-active" />
            </div>
            <span className="text-base font-medium text-foreground">All steps are complete</span>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">What's next?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You're all set up! Explore more features or check out helpful resources to get the most out of Ari.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <a 
                href="https://docs.lovable.dev" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                Explore the Help Center
                <ArrowUpRight size={14} />
              </a>
              <span className="text-muted-foreground">·</span>
              <a 
                href="https://lovable.dev/blog" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                Discover our blog
                <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SetupProgress
        completedCount={completedCount}
        totalCount={totalCount}
      />

      {/* Bordered wrapper around checklist + video */}
      <div className="border border-border rounded-xl bg-card shadow-sm p-6">
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
    </div>
  );
};
