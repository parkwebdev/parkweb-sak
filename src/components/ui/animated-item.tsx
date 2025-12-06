import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface AnimatedItemProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export const AnimatedItem = ({ 
  children, 
  className,
  direction = 'up'
}: AnimatedItemProps) => {
  const directionOffset = {
    up: { y: 20, x: 0 },
    down: { y: -20, x: 0 },
    left: { x: 20, y: 0 },
    right: { x: -20, y: 0 }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0,
      ...directionOffset[direction]
    },
    visible: { 
      opacity: 1,
      x: 0,
      y: 0,
      transition: { 
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1] as [number, number, number, number]
      }
    }
  };

  return (
    <motion.div
      className={cn(className)}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
};