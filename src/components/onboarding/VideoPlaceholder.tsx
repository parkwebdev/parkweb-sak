/**
 * Video Placeholder Component
 * 
 * Placeholder for onboarding video that spans the full height of the step list.
 * Shows a play button overlay with decorative background.
 * 
 * @module components/onboarding/VideoPlaceholder
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayCircle } from '@untitledui/icons';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface VideoPlaceholderProps {
  stepId: string;
}

export const VideoPlaceholder: React.FC<VideoPlaceholderProps> = ({ stepId }) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative w-full h-full min-h-[280px] rounded-xl overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-600 shadow-lg">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-4 left-4 w-20 h-20 rounded-full bg-yellow-400/60" />
        <div className="absolute top-12 right-8 w-16 h-16 rounded-full bg-orange-400/50" />
        <div className="absolute bottom-8 left-8 w-24 h-24 rounded-full bg-pink-400/40" />
        <div className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-purple-400/50" />
      </div>

      {/* Animated content indicator */}
      <AnimatePresence mode="wait">
        <motion.div
          key={stepId}
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {/* Play button */}
          <button
            className="group flex items-center justify-center w-14 h-14 rounded-full bg-background/90 shadow-lg hover:bg-background transition-colors"
            onClick={() => {
              // TODO: Open video modal
              console.log('Play video for step:', stepId);
            }}
            aria-label="Play tutorial video"
          >
            <PlayCircle size={28} className="text-foreground group-hover:text-primary transition-colors" />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
