/**
 * Get Started Page
 * 
 * Main onboarding page with Intercom-style checklist.
 * Two-column layout with step list and video preview.
 * Redirects to /analytics when all steps are complete.
 * 
 * @module pages/GetStarted
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { useOnboardingProgress, OnboardingStep } from '@/hooks/useOnboardingProgress';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { LoadingState } from '@/components/ui/loading-state';
import { 
  SetupChecklist, 
  GoFurtherSection,
  CompletionCelebration,
} from '@/components/onboarding';
import { springs } from '@/lib/motion-variants';
import { supabase } from '@/integrations/supabase/client';

/**
 * Circular progress indicator matching sidebar style
 */
const ProgressCircle: React.FC<{ completedCount: number; totalCount: number }> = ({
  completedCount,
  totalCount,
}) => {
  const isAllComplete = completedCount === totalCount;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;
  const circumference = 2 * Math.PI * 6;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className="flex-shrink-0">
      <circle
        cx="8"
        cy="8"
        r="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-muted-foreground/30"
      />
      <circle
        cx="8"
        cy="8"
        r="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-status-active"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        transform="rotate(-90 8 8)"
        style={{ transition: 'stroke-dashoffset 0.3s ease' }}
      />
      {isAllComplete && (
        <path
          d="M5 8l2 2 4-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-status-active"
        />
      )}
    </svg>
  );
};

export const GetStarted: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationChecked, setCelebrationChecked] = useState(false);
  
  const { 
    steps, 
    completedCount, 
    totalCount,
    allComplete,
    isLoading,
  } = useOnboardingProgress();

  /**
   * Check if user has already seen the celebration and show it if not
   */
  useEffect(() => {
    const checkAndShowCelebration = async () => {
      if (!allComplete || isLoading || !user || celebrationChecked) return;
      
      setCelebrationChecked(true);
      
      // Check if user has already seen the celebration
      const { data: profile } = await supabase
        .from('profiles')
        .select('has_seen_onboarding_celebration')
        .eq('user_id', user.id)
        .single();
      
      if (profile && !profile.has_seen_onboarding_celebration) {
        setShowCelebration(true);
        // Mark as seen in database
        await supabase
          .from('profiles')
          .update({ has_seen_onboarding_celebration: true })
          .eq('user_id', user.id);
      }
    };
    
    checkAndShowCelebration();
  }, [allComplete, isLoading, user, celebrationChecked]);

  /**
   * Handle celebration complete - dismiss the modal
   */
  const handleCelebrationComplete = useCallback(() => {
    setShowCelebration(false);
  }, []);

  /**
   * Handle step action - navigate to the appropriate section
   */
  const handleStepAction = useCallback((step: OnboardingStep) => {
    if (step.action.section) {
      navigate(`/ari?section=${step.action.section}`);
    } else {
      navigate(step.action.route);
    }
  }, [navigate]);

  if (isLoading) {
    return <LoadingState size="xl" fullPage />;
  }

  return (
    <>
      <CompletionCelebration 
        show={showCelebration} 
        onComplete={handleCelebrationComplete} 
      />
      
      <main className="flex-1 min-h-0 h-full overflow-y-auto bg-background flex items-center justify-center">
        <div className="max-w-5xl mx-auto w-full">
          {/* Header */}
          <header className="w-full font-medium pt-4 lg:pt-8">
            <div className="items-stretch flex w-full flex-col gap-2 px-4 lg:px-8 py-0">
              <h1 className="text-3xl font-bold text-foreground">
                Get started with Ari, your AI sales agent
              </h1>
              {/* Progress subheader */}
              <div className="flex items-center gap-2 text-sm">
                <ProgressCircle completedCount={completedCount} totalCount={totalCount} />
                <span className="text-muted-foreground">
                  {allComplete ? 'Completed' : 'Progress'}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  {completedCount}/{totalCount} steps
                </span>
              </div>
            </div>
          </header>

          {/* Checklist */}
          <div className="px-4 lg:px-8 pb-8 pt-6">
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, ...springs.smooth }}
            >
              <SetupChecklist
                steps={steps}
                completedCount={completedCount}
                totalCount={totalCount}
                onStepAction={handleStepAction}
              />
            </motion.div>

            {/* Go Further section */}
            <GoFurtherSection />
          </div>
        </div>
      </main>
    </>
  );
};
