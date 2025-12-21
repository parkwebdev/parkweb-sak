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

export const GetStarted: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [showCelebration, setShowCelebration] = useState(false);
  
  const { 
    steps, 
    completedCount, 
    totalCount,
    allComplete,
    isLoading,
  } = useOnboardingProgress();

  // Get user's first name for greeting (capitalize first letter)
  const rawName = user?.email?.split('@')[0] || 'there';
  const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  /**
   * Show celebration and redirect when all steps complete
   */
  useEffect(() => {
    if (allComplete && !isLoading) {
      setShowCelebration(true);
    }
  }, [allComplete, isLoading]);

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
      
      <main className="flex-1 min-h-0 h-full overflow-y-auto bg-background relative">
        {/* Decorative gradient background */}
        <div 
          className="absolute inset-x-0 top-0 h-80 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% -20%, hsl(var(--primary) / 0.08), transparent)',
          }}
        />
        
        {/* Decorative dot pattern */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="max-w-5xl mx-auto relative">
          {/* Header */}
          <PageHeader
            title={`Welcome, ${firstName} 👋`}
            description={allComplete ? undefined : "Let's get Ari ready to help your customers."}
          />

          {/* Checklist */}
          <div className="px-4 lg:px-8 pb-8">
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
