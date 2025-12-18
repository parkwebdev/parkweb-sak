/**
 * Get Started Page
 * 
 * Main onboarding page with guided setup checklist.
 * Shows 5 steps to configure the AI agent and tracks real-time completion.
 * 
 * @module pages/GetStarted
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { useOnboardingProgress, OnboardingStep } from '@/hooks/useOnboardingProgress';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { LoadingState } from '@/components/ui/loading-state';
import { 
  SetupChecklist, 
  SetupPreviewPanel, 
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
    percentComplete, 
    isLoading,
    currentStep 
  } = useOnboardingProgress();

  // Track which step is being previewed (for the right panel)
  const [previewStep, setPreviewStep] = useState<OnboardingStep | null>(null);

  // Get user's first name for greeting
  const firstName = user?.email?.split('@')[0] || 'there';

  /**
   * Handle step action - navigate to the appropriate section
   */
  const handleStepAction = useCallback((step: OnboardingStep) => {
    if (step.action.section) {
      // Navigate to Ari page and scroll to section
      navigate('/ari');
      // Use a slight delay to allow page to render
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

  /**
   * Handle step hover for preview panel
   */
  const handleStepHover = useCallback((step: OnboardingStep | null) => {
    setPreviewStep(step);
  }, []);

  // Show loading state
  if (isLoading) {
    return <LoadingState size="xl" fullPage />;
  }

  // Determine active step for preview (hovered > current > first)
  const activePreviewStep = previewStep || currentStep || steps[0];

  return (
    <main className="flex-1 min-h-0 h-full overflow-y-auto bg-muted/30">
      <div className="flex flex-col gap-6 lg:gap-8 pt-6 lg:pt-8 pb-8">
        {/* Header */}
        <motion.header 
          className="px-4 lg:px-8"
          initial={prefersReducedMotion ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.smooth}
        >
          <h1 className="text-2xl font-semibold text-foreground">
            Welcome back, {firstName}! 👋
          </h1>
          <p className="text-base text-muted-foreground mt-1">
            Let's get Ari ready to help your customers.
          </p>
        </motion.header>

        {/* Main content - two column layout */}
        <div className="px-4 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left column - Checklist */}
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, ...springs.smooth }}
              >
                <SetupChecklist
                  steps={steps}
                  completedCount={completedCount}
                  totalCount={totalCount}
                  percentComplete={percentComplete}
                  onStepAction={handleStepAction}
                  onStepHover={handleStepHover}
                />
              </motion.div>

              {/* Right column - Preview panel (hidden on mobile) */}
              <motion.div
                className="hidden lg:block"
                initial={prefersReducedMotion ? false : { opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, ...springs.smooth }}
              >
                <SetupPreviewPanel activeStep={activePreviewStep} />
              </motion.div>
            </div>

            {/* Go Further section */}
            <GoFurtherSection />
          </div>
        </div>
      </div>
    </main>
  );
};
