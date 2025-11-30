import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface AnimatedTableRowProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
}

export const AnimatedTableRow = React.forwardRef<HTMLTableRowElement, AnimatedTableRowProps>(
  ({ children, className, index = 0 }, ref) => {
    return (
      <motion.tr
        ref={ref}
        className={cn(className)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          transition: { 
            duration: 0.3,
            delay: index * 0.05,
            ease: [0.4, 0, 0.2, 1] as [number, number, number, number]
          }
        }}
      >
        {children}
      </motion.tr>
    );
  }
);

AnimatedTableRow.displayName = 'AnimatedTableRow';