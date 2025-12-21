/**
 * Setup Checklist Component
 * 
 * Two-column layout: steps on left, video preview on right.
 * Uses the shared Accordion component for consistency.
 * Enhanced with depth through shadows and subtle gradients.
 * 
 * @module components/onboarding/SetupChecklist
 */

import React, { useState } from 'react';
import { ArrowUpRight, CheckCircle, Stars01 } from '@untitledui/icons';
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

  // All complete state - celebratory card
  if (allComplete) {
    return (
      <motion.div 
        className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card shadow-lg shadow-primary/5"
        initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Decorative sparkle elements */}
        <div className="absolute top-4 right-4 text-primary/20">
          <Stars01 size={32} />
        </div>
        <div className="absolute bottom-4 left-4 text-primary/10">
          <Stars01 size={24} />
        </div>
        
        <div className="relative p-6">
          <div className="flex items-center gap-3 mb-4">
            <motion.div 
              className="w-10 h-10 rounded-full bg-status-active/10 flex items-center justify-center ring-4 ring-status-active/5"
              initial={prefersReducedMotion ? {} : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <CheckCircle size={20} className="text-status-active" />
            </motion.div>
            <span className="text-lg font-semibold text-foreground">What's next?</span>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed mb-5">
            You're all set up! Explore more features or check out helpful resources to get the most out of Ari.
          </p>
          <div className="flex flex-wrap gap-3">
            <a 
              href="https://docs.lovable.dev" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Explore the Help Center
              <ArrowUpRight size={14} />
            </a>
            <span className="text-muted-foreground/50">·</span>
            <a 
              href="https://lovable.dev/blog" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Discover our blog
              <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <SetupProgress
        completedCount={completedCount}
        totalCount={totalCount}
      />

      {/* Bordered wrapper with enhanced depth */}
      <div className="relative border border-border rounded-xl bg-card shadow-md shadow-black/5 overflow-hidden">
        {/* Subtle top gradient accent */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        
        <div className="p-6">
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
                    <AccordionTrigger showIcon={false} className="py-3 px-1 hover:bg-muted/30 transition-colors rounded-lg">
                      <div className="flex items-center gap-3 w-full">
                        {/* Step indicator */}
                        <div className="flex-shrink-0">
                          {step.isComplete ? (
                            <motion.div
                              initial={prefersReducedMotion ? false : { scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                              className="w-5 h-5 rounded-full bg-status-active/10 border-2 border-status-active/40 flex items-center justify-center"
                            >
                              <div className="w-2 h-2 rounded-full bg-status-active" />
                            </motion.div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 bg-muted/30" />
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
            <div className="hidden sm:flex w-72 md:w-96 lg:w-[28rem] flex-shrink-0">
              <VideoPlaceholder stepId={expandedStepId || steps[0]?.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
