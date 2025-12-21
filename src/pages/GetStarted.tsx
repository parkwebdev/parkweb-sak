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
import { PageHeader } from '@/components/ui/page-header';
import { springs } from '@/lib/motion-variants';
import { supabase } from '@/integrations/supabase/client';

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
          <PageHeader
            title="Get started with Ari, your AI sales agent"
          />

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
