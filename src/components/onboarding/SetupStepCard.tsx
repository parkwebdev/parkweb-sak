/**
 * Setup Step Card Component
 * 
 * Borderless expandable step matching Intercom's minimal onboarding style.
 * Description shown on expand, video is in separate column.
 * 
 * @module components/onboarding/SetupStepCard
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, ChevronRight } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { OnboardingStep } from '@/hooks/useOnboardingProgress';

interface SetupStepCardProps {
  step: OnboardingStep;
  isExpanded: boolean;
  onClick: () => void;
  onAction: () => void;
}

export const SetupStepCard: React.FC<SetupStepCardProps> = ({
  step,
  isExpanded,
  onClick,
  onAction,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const isComplete = step.isComplete;

  return (
    <div className="border-b border-border last:border-b-0">
      {/* Header row - always visible */}
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3 py-3 px-1 hover:bg-muted/30 transition-colors text-left"
      >
        {/* Step indicator */}
        <div className="flex-shrink-0">
          {isComplete ? (
            <motion.div
              initial={prefersReducedMotion ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              <CheckCircle size={20} className="text-status-active" />
            </motion.div>
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/40" />
          )}
        </div>

        {/* Title */}
        <span className={`flex-1 text-sm font-medium ${isComplete ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
          {step.title}
        </span>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.15 }}
          className="flex-shrink-0"
        >
          <ChevronRight size={18} className="text-muted-foreground" />
        </motion.div>
      </button>

      {/* Expanded content - just description and CTA, no video */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="pb-4 pl-8 pr-1 space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onAction();
                }}
                size="sm"
                variant={isComplete ? 'outline' : 'default'}
              >
                {step.action.label}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
