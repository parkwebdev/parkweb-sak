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
import { InviteTeamInline } from './InviteTeamInline';
import { SetupFeedbackToast } from './SetupFeedbackToast';
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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring' as const, stiffness: 300, damping: 24 }
    },
  };

  // All complete state - enhanced version
  if (allComplete) {
    return (
      <>
        {/* What's next card - contains video, links, and invite */}
        <motion.div 
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          className="border border-border rounded-xl bg-card shadow-sm p-6"
        >
          {/* Two-column layout: content left, video right */}
          <div className="flex gap-6">
            {/* Left column: Text content */}
            <motion.div 
              className="flex-1 min-w-0 flex flex-col"
              variants={containerVariants}
              initial={prefersReducedMotion ? false : "hidden"}
              animate="visible"
            >
              <motion.h2 
                variants={itemVariants}
                className="text-base font-medium text-foreground mb-1"
              >
                What's next?
              </motion.h2>
              <motion.p 
                variants={itemVariants}
                className="text-sm text-muted-foreground leading-relaxed mb-4"
              >
                You're all set up! Explore more features or check out helpful resources to get the most out of Ari.
              </motion.p>
              <motion.div variants={itemVariants} className="mb-4">
                <a 
                  href="https://docs.lovable.dev" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 text-sm text-primary hover:underline transition-colors"
                >
                  Explore the Help Center
                  <motion.span
                    className="inline-block"
                    whileHover={{ x: 2, y: -2 }}
                    transition={{ type: 'spring' as const, stiffness: 400, damping: 20 }}
                  >
                    <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </motion.span>
                </a>
              </motion.div>

              {/* Divider and Invite Team inline */}
              <motion.div variants={itemVariants}>
                <Separator className="my-4" />
                <InviteTeamInline />
              </motion.div>
            </motion.div>

            {/* Right column: Video placeholder (same style as steps page) */}
            <motion.div 
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.2 }}
              className="hidden sm:flex w-72 md:w-96 lg:w-[28rem] flex-shrink-0"
            >
              <div className="relative w-full h-full min-h-[280px] rounded-xl overflow-hidden bg-gradient-to-br from-violet-600 via-purple-500 to-fuchsia-500 shadow-lg group">
                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.button
                    whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
                    whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                    className="flex items-center justify-center w-14 h-14 rounded-full bg-white/20 backdrop-blur-md shadow-lg hover:bg-white/30 transition-colors"
                    onClick={() => {
                      // TODO: Open video modal
                      console.log('Play next level video');
                    }}
                    aria-label="Play tutorial video"
                  >
                    <PlayIcon size={32} className="text-white group-hover:text-white/90 transition-colors" />
                  </motion.button>
                </div>
                {/* Duration badge */}
                <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-white/20 backdrop-blur-sm text-xs text-white font-medium">
                  3:24
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Floating feedback toast */}
        <SetupFeedbackToast hasRated={hasRated} />
      </>
    );
  }

  return (
    <motion.div 
      initial={prefersReducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      >
        <SetupProgress
          completedCount={completedCount}
          totalCount={totalCount}
        />
      </motion.div>

      {/* Bordered wrapper around checklist + video */}
      <motion.div 
        initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.1 }}
        className="border border-border rounded-xl bg-card shadow-sm p-6"
      >
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
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={prefersReducedMotion ? false : { opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 300, 
                    damping: 24,
                    delay: 0.15 + index * 0.05
                  }}
                >
                  <AccordionItem value={step.id} className="border-border">
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
                              <motion.div 
                                initial={prefersReducedMotion ? false : { scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 25, delay: 0.1 }}
                                className="w-1.5 h-1.5 rounded-full bg-status-active" 
                              />
                            </motion.div>
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/40" />
                          )}
                        </div>

                        {/* Title */}
                        <span className={`flex-1 text-left text-sm font-medium transition-colors ${step.isComplete ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                          {step.title}
                        </span>
                      </div>
                    </AccordionTrigger>
                    
                    <AccordionContent className="pb-4 pl-8 pr-1">
                      <motion.div 
                        initial={prefersReducedMotion ? false : { opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                        className="space-y-3"
                      >
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {step.description}
                        </p>
                        <motion.div
                          whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                          whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                        >
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
                        </motion.div>
                      </motion.div>
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          </div>

          {/* Right column: Video placeholder spanning full height */}
          <motion.div 
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.3 }}
            className="hidden sm:flex w-72 md:w-96 lg:w-[28rem] flex-shrink-0"
          >
            <VideoPlaceholder stepId={expandedStepId || steps[0]?.id} />
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};
