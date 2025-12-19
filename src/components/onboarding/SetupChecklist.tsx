/**
 * Setup Checklist Component
 * 
 * Two-column layout: steps on left, video preview on right.
 * Uses the shared Accordion component for consistency.
 * 
 * @module components/onboarding/SetupChecklist
 */

import React, { useState } from 'react';
import { CheckCircle, ArrowUpRight } from '@untitledui/icons';
import { motion } from 'motion/react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { SetupProgress } from './SetupProgress';
import { VideoPlaceholder } from './VideoPlaceholder';
import { Button } from '@/components/ui/button';
import { useReducedMotion } from '@/hooks/useReducedMotion';
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
  const prefersReducedMotion = useReducedMotion();
  
  // Default to first incomplete step
  const defaultStep = steps.find(s => !s.isComplete)?.id || steps[0]?.id || '';
  const [expandedStepId, setExpandedStepId] = useState<string>(defaultStep);

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
          {/* Left column: Step list using Accordion */}
          <div className="flex-1 min-w-0">
            <Accordion
              type="single"
              collapsible
              value={expandedStepId}
              onValueChange={(value) => setExpandedStepId(value || '')}
              className="bg-transparent border-0 px-0"
            >
              {steps.map((step) => (
                <AccordionItem key={step.id} value={step.id} className="border-border">
                  <AccordionTrigger showIcon={false} className="py-3 px-1 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 w-full">
                      {/* Step indicator */}
                      <div className="flex-shrink-0">
                        {step.isComplete ? (
                          <motion.div
                            initial={prefersReducedMotion ? false : { scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                          >
                            <CheckCircle size={20} className="text-status-active" />
                          </motion.div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/40" />
                        )}
                      </div>

                      {/* Title */}
                      <span className={`flex-1 text-left text-sm font-medium ${step.isComplete ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {step.title}
                      </span>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="pb-4 pl-8 pr-1">
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStepAction(step);
                        }}
                        size="sm"
                        variant={step.isComplete ? 'outline' : 'default'}
                      >
                        {step.action.label}
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Right column: Video placeholder spanning full height */}
          <div className="hidden sm:flex w-64 md:w-80 lg:w-96 flex-shrink-0">
            <VideoPlaceholder stepId={expandedStepId || steps[0]?.id} />
          </div>
        </div>
      </div>
    </div>
  );
};
