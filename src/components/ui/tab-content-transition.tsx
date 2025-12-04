import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TabContentTransitionProps {
  children: React.ReactNode;
  activeKey: string;
  className?: string;
}

export const TabContentTransition = ({ 
  children, 
  activeKey,
  className 
}: TabContentTransitionProps) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeKey}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ 
          duration: 0.2, 
          ease: [0.4, 0, 0.2, 1] 
        }}
        className={`flex-1 min-h-0 flex flex-col ${className || ''}`}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
