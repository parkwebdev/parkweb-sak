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
const STEP_GRADIENTS: Record<string, {
  gradient: string;
  decorations: { position: string; size: string; color: string }[];
}> = {
  personality: {
    gradient: 'from-violet-600 via-purple-500 to-fuchsia-500',
    decorations: [
      { position: 'top-4 left-4', size: 'w-20 h-20', color: 'bg-pink-400/60' },
      { position: 'top-12 right-8', size: 'w-16 h-16', color: 'bg-yellow-400/50' },
      { position: 'bottom-8 left-8', size: 'w-24 h-24', color: 'bg-blue-400/40' },
      { position: 'bottom-4 right-4', size: 'w-12 h-12', color: 'bg-indigo-400/50' },
    ],
  },
  knowledge: {
    gradient: 'from-blue-600 via-cyan-500 to-teal-500',
    decorations: [
      { position: 'top-4 left-4', size: 'w-20 h-20', color: 'bg-cyan-400/60' },
      { position: 'top-12 right-8', size: 'w-16 h-16', color: 'bg-emerald-400/50' },
      { position: 'bottom-8 left-8', size: 'w-24 h-24', color: 'bg-sky-400/40' },
      { position: 'bottom-4 right-4', size: 'w-12 h-12', color: 'bg-teal-400/50' },
    ],
  },
  appearance: {
    gradient: 'from-orange-500 via-amber-500 to-yellow-500',
    decorations: [
      { position: 'top-4 left-4', size: 'w-20 h-20', color: 'bg-red-400/60' },
      { position: 'top-12 right-8', size: 'w-16 h-16', color: 'bg-pink-400/50' },
      { position: 'bottom-8 left-8', size: 'w-24 h-24', color: 'bg-orange-400/40' },
      { position: 'bottom-4 right-4', size: 'w-12 h-12', color: 'bg-yellow-400/50' },
    ],
  },
  installation: {
    gradient: 'from-emerald-600 via-green-500 to-lime-500',
    decorations: [
      { position: 'top-4 left-4', size: 'w-20 h-20', color: 'bg-teal-400/60' },
      { position: 'top-12 right-8', size: 'w-16 h-16', color: 'bg-cyan-400/50' },
      { position: 'bottom-8 left-8', size: 'w-24 h-24', color: 'bg-emerald-400/40' },
      { position: 'bottom-4 right-4', size: 'w-12 h-12', color: 'bg-green-400/50' },
    ],
  },
  test: {
    gradient: 'from-rose-600 via-pink-500 to-fuchsia-500',
    decorations: [
      { position: 'top-4 left-4', size: 'w-20 h-20', color: 'bg-purple-400/60' },
      { position: 'top-12 right-8', size: 'w-16 h-16', color: 'bg-violet-400/50' },
      { position: 'bottom-8 left-8', size: 'w-24 h-24', color: 'bg-pink-400/40' },
      { position: 'bottom-4 right-4', size: 'w-12 h-12', color: 'bg-rose-400/50' },
    ],
  },
};

const DEFAULT_CONFIG = STEP_GRADIENTS.personality;

export const VideoPlaceholder: React.FC<VideoPlaceholderProps> = ({ stepId }) => {
  const prefersReducedMotion = useReducedMotion();
  const config = STEP_GRADIENTS[stepId] || DEFAULT_CONFIG;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepId}
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={prefersReducedMotion ? undefined : { opacity: 0 }}
        transition={{ duration: 0.3 }}
        className={`relative w-full h-full min-h-[280px] rounded-xl overflow-hidden bg-gradient-to-br ${config.gradient} shadow-lg`}
      >
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-30">
          {config.decorations.map((dec, i) => (
            <div
              key={i}
              className={`absolute ${dec.position} ${dec.size} rounded-full ${dec.color}`}
            />
          ))}
        </div>

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
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
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
