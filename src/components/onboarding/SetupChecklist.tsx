/**
 * Setup Checklist Component
 * 
 * Two-column layout: steps on left, video preview on right.
 * Uses the shared Accordion component for consistency.
 * 
 * @module components/onboarding/SetupChecklist
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowUpRight } from '@untitledui/icons';
import { motion } from 'motion/react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

import { VideoPlaceholder } from './VideoPlaceholder';
import { InviteTeamInline } from './InviteTeamInline';
import { SetupFeedbackToast } from './SetupFeedbackToast';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PlayIcon } from '@/components/icons/PlayIcon';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useCanManage } from '@/hooks/useCanManage';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { OnboardingStep } from '@/hooks/useOnboardingProgress';

interface SetupChecklistProps {
  steps: OnboardingStep[];
  completedCount: number;
  totalCount: number;
  onStepAction: (step: OnboardingStep) => void;
}

export function SetupChecklist({
  steps,
  completedCount,
  totalCount,
  onStepAction,
}: SetupChecklistProps) {
  const prefersReducedMotion = useReducedMotion();
  const { user } = useAuth();
  const [hasRated, setHasRated] = useState(false);
  
  // Check if user can manage Ari
  const canManageAri = useCanManage('manage_ari');
  
  // Filter steps based on permissions - hide Ari-related steps if user lacks manage_ari
  const visibleSteps = useMemo(() => {
    return steps.filter(step => {
      // If step navigates to /ari, check permission
      if (step.action.route.startsWith('/ari') || step.action.section) {
        return canManageAri;
      }
      return true;
    });
  }, [steps, canManageAri]);
  
  const visibleCompletedCount = visibleSteps.filter(s => s.isComplete).length;
  const visibleTotalCount = visibleSteps.length;
  const allComplete = visibleCompletedCount === visibleTotalCount;
  
  // Default to first incomplete step
  const defaultStep = visibleSteps.find(s => !s.isComplete)?.id || visibleSteps[0]?.id || '';
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
                      logger.debug('Play next level video');
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
    >
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
              {visibleSteps.map((step, index) => (
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
                            >
                              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" className="text-status-active" aria-hidden="true">
                                <path
                                  fillRule="evenodd"
                                  clipRule="evenodd"
                                  d="M2.0315 12C2.0312 11.8662 2.00492 11.7325 1.95265 11.6065L1.23121 9.85975C1.07879 9.49188 1.00006 9.09699 1 8.69879C0.999936 8.30038 1.07838 7.90585 1.23084 7.53776C1.3833 7.16967 1.6068 6.83523 1.88856 6.55355C2.17025 6.27194 2.50465 6.04858 2.87267 5.89623L4.6166 5.17384C4.86916 5.06941 5.0706 4.86887 5.17575 4.61659L5.8983 2.87214C6.20608 2.12905 6.79645 1.53866 7.53953 1.23085C8.28261 0.923049 9.11753 0.923048 9.86061 1.23085L11.6037 1.9529C11.8567 2.05733 12.141 2.0572 12.3938 1.95231L12.3958 1.95149L14.1404 1.23192C14.8832 0.924529 15.7183 0.924429 16.4611 1.23209C17.204 1.53984 17.7943 2.13006 18.1021 2.87295L18.8073 4.57552C18.8136 4.58896 18.8196 4.60259 18.8253 4.61641C18.9298 4.86924 19.1304 5.07024 19.383 5.1753L21.1279 5.8981C21.871 6.20591 22.4614 6.7963 22.7692 7.53939C23.0769 8.28247 23.0769 9.11739 22.7692 9.86048L22.0468 11.6045C21.9943 11.7311 21.9681 11.8661 21.9681 12.0003C21.9681 12.1345 21.9943 12.2689 22.0468 12.3955L22.7692 14.1395C23.0769 14.8826 23.0769 15.7175 22.7692 16.4606C22.4614 17.2037 21.871 17.7941 21.1279 18.1019L19.383 18.8247C19.1304 18.9298 18.9298 19.1308 18.8253 19.3836C18.8196 19.3974 18.8136 19.411 18.8073 19.4245L18.1021 21.127C17.7943 21.8699 17.204 22.4602 16.4611 22.7679C15.7183 23.0756 14.8832 23.0755 14.1404 22.7681L12.3958 22.0485L12.3938 22.0477C12.141 21.9428 11.8567 21.9427 11.6037 22.0471L9.86061 22.7691C9.11753 23.077 8.28261 23.077 7.53953 22.7691C6.79645 22.4613 6.20608 21.8709 5.8983 21.1279L5.17575 19.3834C5.0706 19.1311 4.86916 18.9306 4.6166 18.8262L2.87267 18.1038C2.50465 17.9514 2.17025 17.7281 1.88856 17.4465C1.6068 17.1648 1.3833 16.8303 1.23084 16.4622C1.07838 16.0941 0.999936 15.6996 1 15.3012C1.00006 14.903 1.07879 14.5081 1.23121 14.1402L1.95265 12.3935C2.00492 12.2675 2.0312 12.1338 2.0315 12ZM16.2071 10.2071C16.5976 9.81658 16.5976 9.18342 16.2071 8.79289C15.8166 8.40237 15.1834 8.40237 14.7929 8.79289L11 12.5858L9.70711 11.2929C9.31658 10.9024 8.68342 10.9024 8.29289 11.2929C7.90237 11.6834 7.90237 12.3166 8.29289 12.7071L10.2929 14.7071C10.6834 15.0976 11.3166 15.0976 11.7071 14.7071L16.2071 10.2071Z"
                                  fill="currentColor"
                                />
                              </svg>
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
            <VideoPlaceholder stepId={expandedStepId || visibleSteps[0]?.id} />
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};
