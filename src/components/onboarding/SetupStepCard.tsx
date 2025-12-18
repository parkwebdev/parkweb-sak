/**
 * Setup Step Card Component
 * 
 * Individual expandable step card for the onboarding checklist.
 * Shows completion state, title, subtitle, and CTA button.
 * 
 * @module components/onboarding/SetupStepCard
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, ChevronRight } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springs } from '@/lib/motion-variants';
import type { OnboardingStep } from '@/hooks/useOnboardingProgress';

interface SetupStepCardProps {
  step: OnboardingStep;
  stepNumber: number;
  isExpanded: boolean;
  isCurrent: boolean;
  onClick: () => void;
  onAction: () => void;
}

export const SetupStepCard: React.FC<SetupStepCardProps> = ({
  step,
  stepNumber,
  isExpanded,
  isCurrent,
  onClick,
  onAction,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const Icon = step.icon;

  // Determine visual state
  const isComplete = step.isComplete;

  return (
    <motion.div
      className={`
        rounded-lg border transition-colors cursor-pointer
        ${isComplete 
          ? 'bg-status-active/5 dark:bg-status-active/10 border-status-active/20' 
          : isCurrent 
            ? 'bg-card border-primary ring-2 ring-primary/20' 
            : 'bg-muted/50 dark:bg-muted/30 border-border hover:border-border/80'
        }
      `}
      onClick={onClick}
      layout={!prefersReducedMotion}
      transition={prefersReducedMotion ? { duration: 0 } : springs.smooth}
    >
      {/* Header - always visible */}
      <div className="flex items-center gap-3 p-4">
        {/* Step indicator */}
        <div className="flex-shrink-0">
          {isComplete ? (
            <motion.div
              initial={prefersReducedMotion ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={springs.bouncy}
            >
              <CheckCircle size={24} className="text-status-active" />
            </motion.div>
          ) : (
            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
              ${isCurrent 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted-foreground/20 text-muted-foreground'
              }
            `}>
              {stepNumber}
            </div>
          )}
        </div>

        {/* Title and icon */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Icon size={16} className={isComplete ? 'text-status-active' : 'text-muted-foreground'} />
            <h3 className={`text-base font-medium truncate ${isComplete ? 'text-status-active' : 'text-foreground'}`}>
              {step.title}
            </h3>
          </div>
          {!isExpanded && (
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {isComplete ? 'Completed' : step.subtitle}
            </p>
          )}
        </div>

        {/* Chevron indicator */}
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronRight size={20} className="text-muted-foreground" />
        </motion.div>
      </div>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0">
              <div className="pl-9">
                <p className="text-sm text-muted-foreground mb-4">
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
