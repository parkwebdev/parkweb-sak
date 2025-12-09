import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { staggerItemVariants, staggerItemReducedVariants, getVariants } from '@/lib/motion-variants';

interface AnimatedTableRowProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
  enableHover?: boolean;
}

export const AnimatedTableRow = React.forwardRef<HTMLTableRowElement, AnimatedTableRowProps>(
  ({ children, className, index = 0, enableHover = true }, ref) => {
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
      >
        {children}
      </motion.tr>
    );
  }
);

AnimatedTableRow.displayName = 'AnimatedTableRow';