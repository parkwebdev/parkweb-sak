/**
 * AnimatedList Component
 * 
 * Container for staggered list animations with configurable timing.
 * Wraps children with motion animations for smooth enter/exit effects.
 * @module components/ui/animated-list
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { staggerContainerVariants, staggerContainerFastVariants, staggerContainerSlowVariants } from '@/lib/motion-variants';

interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
  /** Stagger speed: 'fast' (0.03s), 'normal' (0.05s), 'slow' (0.08s) */
  staggerSpeed?: 'fast' | 'normal' | 'slow';
  /** Custom stagger delay in seconds (overrides staggerSpeed) */
  staggerDelay?: number;
  /** Initial delay before first child animates */
  initialDelay?: number;
  /** Enable AnimatePresence for exit animations */
  enableExitAnimation?: boolean;
  /** Enable layout animations for reordering */
  layout?: boolean;
}

const getStaggerVariants = (speed: 'fast' | 'normal' | 'slow') => {
  switch (speed) {
    case 'fast':
      return staggerContainerFastVariants;
    case 'slow':
      return staggerContainerSlowVariants;
    default:
      return staggerContainerVariants;
  }
};

export const AnimatedList = ({ 
  children, 
  className,
  staggerSpeed = 'normal',
  staggerDelay,
  initialDelay,
  enableExitAnimation = false,
  layout = false,
}: AnimatedListProps) => {
  const prefersReducedMotion = useReducedMotion();

  // Get base variants
  const baseVariants = getStaggerVariants(staggerSpeed);
  
  // Override with custom values if provided
  // Type-safe access to transition properties from Variants
  const baseVisibleTransition = typeof baseVariants.visible === 'object' && 'transition' in baseVariants.visible 
    ? (baseVariants.visible.transition as { staggerChildren?: number; delayChildren?: number } | undefined)
    : undefined;
  
  const variants = {
    hidden: baseVariants.hidden,
    visible: {
      ...baseVariants.visible,
      transition: {
        staggerChildren: staggerDelay ?? baseVisibleTransition?.staggerChildren,
        delayChildren: initialDelay ?? baseVisibleTransition?.delayChildren,
      },
    },
    exit: baseVariants.exit,
  };

  // Reduced motion: instant transitions
  const reducedVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0 } },
    exit: { opacity: 0, transition: { duration: 0 } },
  };

  const content = (
    <motion.div
      className={cn(className)}
      variants={prefersReducedMotion ? reducedVariants : variants}
      initial="hidden"
      animate="visible"
      exit={enableExitAnimation ? "exit" : undefined}
      layout={layout && !prefersReducedMotion}
    >
      {children}
    </motion.div>
  );

  if (enableExitAnimation) {
    return <AnimatePresence mode="wait">{content}</AnimatePresence>;
  }

  return content;
};

export default AnimatedList;
