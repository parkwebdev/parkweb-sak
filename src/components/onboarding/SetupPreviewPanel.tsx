/**
 * Setup Preview Panel Component
 * 
 * Context-aware right panel showing tips, video placeholders,
 * and guidance for the currently selected onboarding step.
 * 
 * @module components/onboarding/SetupPreviewPanel
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lightbulb01, 
  CheckCircle
} from '@untitledui/icons';
import { VideoPlaceholder } from './VideoPlaceholder';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { OnboardingStep } from '@/hooks/useOnboardingProgress';

interface SetupPreviewPanelProps {
  activeStep: OnboardingStep | null;
}

/**
 * Step-specific tips content
 */
const STEP_TIPS: Record<string, { title: string; tips: string[] }> = {
  personality: {
    title: 'Tips for writing a great system prompt',
    tips: [
      'Be specific about the tone (friendly, professional, casual)',
      'Define what topics Ari should and shouldn\'t discuss',
      'Include examples of ideal responses',
      'Mention your company name and key products/services',
    ],
  },
  knowledge: {
    title: 'What makes good knowledge sources',
    tips: [
      'Start with your FAQ or help docs page',
      'Add product pages with detailed descriptions',
      'Include pricing and policy information',
      'Keep content up-to-date for best results',
    ],
  },
  appearance: {
    title: 'Customization best practices',
    tips: [
      'Use your brand\'s primary color for the widget',
      'Keep the welcome message under 50 characters',
      'Upload a logo or avatar for brand recognition',
      'Test on both light and dark backgrounds',
    ],
  },
  installation: {
    title: 'Installation tips',
    tips: [
      'Add the code just before the closing </body> tag',
      'Test on a staging site first if possible',
      'The widget loads asynchronously - won\'t slow your site',
      'Works on any platform: WordPress, Shopify, Webflow, etc.',
    ],
  },
  test: {
    title: 'What to test',
    tips: [
      'Ask questions your customers frequently ask',
      'Test edge cases and unusual requests',
      'Check if Ari stays within the boundaries you set',
      'Verify knowledge sources are being used correctly',
    ],
  },
};

export const SetupPreviewPanel: React.FC<SetupPreviewPanelProps> = ({
  activeStep,
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  if (!activeStep) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground text-sm">Select a step to see details</p>
      </div>
    );
  }

  const tips = STEP_TIPS[activeStep.id];
  const Icon = activeStep.icon;

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep.id}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Video placeholder */}
          <VideoPlaceholder stepId={activeStep.id} />

          {/* Step header */}
          <div className="flex items-start gap-3">
            <div className={`
              w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
              ${activeStep.isComplete 
                ? 'bg-status-active/10 text-status-active' 
                : 'bg-primary/10 text-primary'
              }
            `}>
              {activeStep.isComplete ? (
                <CheckCircle size={20} />
              ) : (
                <Icon size={20} />
              )}
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {activeStep.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {activeStep.subtitle}
              </p>
            </div>
          </div>

          {/* Tips section */}
          {tips && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lightbulb01 size={16} />
                <span className="text-sm font-medium">{tips.title}</span>
              </div>
              <ul className="space-y-2">
                {tips.tips.map((tip, index) => (
                  <motion.li
                    key={index}
                    initial={prefersReducedMotion ? false : { opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 mt-1.5 flex-shrink-0" />
                    {tip}
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
