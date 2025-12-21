/**
 * Setup Checklist Component
 * 
 * Two-column layout: steps on left, video preview on right.
 * Uses the shared Accordion component for consistency.
 * 
 * @module components/onboarding/SetupChecklist
 */

import React, { useState, useEffect } from 'react';
import { ArrowUpRight } from '@untitledui/icons';
import { motion } from 'motion/react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { SetupProgress } from './SetupProgress';
import { VideoPlaceholder } from './VideoPlaceholder';
import { QuickStatsSummary } from './QuickStatsSummary';
import { InviteTeamInline } from './InviteTeamInline';
import { KeyboardShortcutsCard } from './KeyboardShortcutsCard';
import { SetupFeedback } from './SetupFeedback';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PlayIcon } from '@/components/icons/PlayIcon';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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
  const { user } = useAuth();
  const [hasRated, setHasRated] = useState(false);
  
  // Default to first incomplete step
  const defaultStep = steps.find(s => !s.isComplete)?.id || steps[0]?.id || '';
  const [expandedStepId, setExpandedStepId] = useState<string>(defaultStep);

  // Check if user has already rated
  useEffect(() => {
    const checkRating = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('setup_rating')
        .eq('user_id', user.id)
        .single();
      
      if (data?.setup_rating) {
        setHasRated(true);
      }
    };
    checkRating();
  }, [user]);

  // All complete state - enhanced version
  if (allComplete) {
    return (
      <div className="space-y-4">
        {/* What's next card - contains video, links, and invite */}
        <div className="border border-border rounded-xl bg-card shadow-sm p-6">
          {/* Two-column layout: content left, video right */}
          <div className="flex gap-6">
            {/* Left column: Text content */}
            <div className="flex-1 min-w-0 flex flex-col">
              <h2 className="text-base font-medium text-foreground mb-1">What's next?</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                You're all set up! Explore more features or check out helpful resources to get the most out of Ari.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
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

              {/* Divider and Invite Team inline */}
              <Separator className="my-4" />
              <InviteTeamInline />
            </div>

            {/* Right column: Video placeholder (same style as steps page) */}
            <div className="hidden sm:flex w-72 md:w-96 lg:w-[28rem] flex-shrink-0">
              <div className="relative w-full h-full min-h-[280px] rounded-xl overflow-hidden bg-gradient-to-br from-violet-600 via-purple-500 to-fuchsia-500 shadow-lg">
                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    className="group flex items-center justify-center w-14 h-14 rounded-full bg-white/20 backdrop-blur-md shadow-lg hover:bg-white/30 transition-colors"
                    onClick={() => {
                      // TODO: Open video modal
                      console.log('Play next level video');
                    }}
                    aria-label="Play tutorial video"
                  >
                    <PlayIcon size={32} className="text-white group-hover:text-white/90 transition-colors" />
                  </button>
                </div>
                {/* Duration badge */}
                <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-white/20 backdrop-blur-sm text-xs text-white font-medium">
                  3:24
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Summary */}
        <QuickStatsSummary />

        {/* Keyboard Shortcuts */}
        <KeyboardShortcutsCard />

        {/* Feedback/NPS Prompt */}
        <SetupFeedback hasRated={hasRated} />
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
                            className="w-4 h-4 rounded-full border-2 border-status-active/40 flex items-center justify-center"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-status-active" />
                          </motion.div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/40" />
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
  );
};
