/**
 * AnimatedTableRow Component
 * 
 * Motion-enabled table row with staggered animation and hover effects.
 * Respects reduced motion preferences for accessibility.
 * @module components/ui/animated-table-row
 */

import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { staggerItemVariants, staggerItemReducedVariants, getVariants } from '@/lib/motion-variants';

interface AnimatedTableRowProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
  enableHover?: boolean;
  onClick?: () => void;
  'data-state'?: string;
}

export const AnimatedTableRow = React.forwardRef<HTMLTableRowElement, AnimatedTableRowProps>(
  ({ children, className, index = 0, enableHover = true, onClick, 'data-state': dataState, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();
    const variants = getVariants(staggerItemVariants, staggerItemReducedVariants, prefersReducedMotion);

    return (
      <motion.tr
        ref={ref}
        className={cn(
          enableHover && 'transition-colors',
          className
        )}
        variants={variants}
        initial="hidden"
        animate="visible"
        custom={index}
        whileHover={enableHover && !prefersReducedMotion ? { 
          backgroundColor: 'hsl(var(--muted) / 0.5)',
          transition: { duration: 0.15 }
        } : undefined}
        onClick={onClick}
        data-state={dataState}
      >
        {children}
      </motion.tr>
    );
  }
);

AnimatedTableRow.displayName = 'AnimatedTableRow';