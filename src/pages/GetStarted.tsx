/**
 * Get Started Page
 * 
 * Main onboarding page with Intercom-style checklist.
 * Single column layout with inline video placeholders.
 * 
 * @module pages/GetStarted
 */

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { useOnboardingProgress, OnboardingStep } from '@/hooks/useOnboardingProgress';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { LoadingState } from '@/components/ui/loading-state';
import { 
  SetupChecklist, 
  GoFurtherSection 
} from '@/components/onboarding';
import { springs } from '@/lib/motion-variants';

export const GetStarted: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  
  const { 
    steps, 
    completedCount, 
    totalCount, 
    isLoading,
  } = useOnboardingProgress();

  // Get user's first name for greeting
  const firstName = user?.email?.split('@')[0] || 'there';

  /**
   * Handle step action - navigate to the appropriate section
   */
  const handleStepAction = useCallback((step: OnboardingStep) => {
    if (step.action.section) {
      navigate('/ari');
      setTimeout(() => {
        const element = document.getElementById(step.action.section!);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      navigate(step.action.route);
    }
  }, [navigate]);

  if (isLoading) {
    return <LoadingState size="xl" fullPage />;
  }

  return (
    <main className="flex-1 min-h-0 h-full overflow-y-auto bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8 lg:py-12">
        {/* Header */}
        <motion.header 
          className="mb-6"
          initial={prefersReducedMotion ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.smooth}
        >
          <h1 className="text-xl font-semibold text-foreground">
            Welcome, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Let's get Ari ready to help your customers.
          </p>
        </motion.header>

        {/* Checklist */}
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
    </main>
  );
};
