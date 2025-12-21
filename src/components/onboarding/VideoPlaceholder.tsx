/**
 * Video Placeholder Component
 * 
 * Placeholder for onboarding video that spans the full height of the step list.
 * Shows a play button overlay with step-specific gradient backgrounds.
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

/**
 * Step-specific gradient configurations
 */
const STEP_GRADIENTS: Record<string, string> = {
  personality: 'from-violet-600 via-purple-500 to-fuchsia-500',
  knowledge: 'from-blue-600 via-cyan-500 to-teal-500',
  appearance: 'from-orange-500 via-amber-500 to-yellow-500',
  installation: 'from-emerald-600 via-green-500 to-lime-500',
  test: 'from-rose-600 via-pink-500 to-fuchsia-500',
  locations: 'from-sky-600 via-blue-500 to-indigo-500',
  'help-articles': 'from-teal-600 via-emerald-500 to-green-500',
  announcements: 'from-amber-600 via-orange-500 to-red-500',
  news: 'from-indigo-600 via-purple-500 to-pink-500',
};

const DEFAULT_GRADIENT = STEP_GRADIENTS.personality;

export const VideoPlaceholder: React.FC<VideoPlaceholderProps> = ({ stepId }) => {
  const prefersReducedMotion = useReducedMotion();
  const gradient = STEP_GRADIENTS[stepId] || DEFAULT_GRADIENT;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepId}
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={prefersReducedMotion ? undefined : { opacity: 0 }}
        transition={{ duration: 0.3 }}
        className={`relative w-full h-full min-h-[280px] rounded-xl overflow-hidden bg-gradient-to-br ${gradient} shadow-lg group`}
      >
        {/* Dark overlay for better contrast */}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/90 hover:bg-primary shadow-lg transition-colors"
            onClick={() => {
              // TODO: Open video modal
              console.log('Play video for step:', stepId);
            }}
            aria-label="Play tutorial video"
          >
            <PlayCircle className="w-8 h-8 text-primary-foreground" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
