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
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Custom Play Icon with filled circle
 */
const PlayIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1ZM9.59974 8.11608C9.5 8.24931 9.5 8.48795 9.5 8.96524V15.0346C9.5 15.5119 9.5 15.7505 9.59974 15.8837C9.68666 15.9998 9.81971 16.0725 9.96438 16.0828C10.1304 16.0947 10.3311 15.9656 10.7326 15.7075L15.4532 12.6728C15.8016 12.4489 15.9758 12.3369 16.0359 12.1945C16.0885 12.0701 16.0885 11.9297 16.0359 11.8053C15.9758 11.6629 15.8016 11.5509 15.4532 11.327L10.7326 8.2923C10.3311 8.0342 10.1304 7.90515 9.96438 7.91701C9.81971 7.92734 9.68666 7.99998 9.59974 8.11608Z"
      fill="currentColor"
    />
  </svg>
);

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
            className="group flex items-center justify-center w-14 h-14 rounded-full bg-white/20 backdrop-blur-md shadow-lg hover:bg-white/30 transition-colors"
            onClick={() => {
              // TODO: Open video modal
              console.log('Play video for step:', stepId);
            }}
            aria-label="Play tutorial video"
          >
            <PlayIcon size={32} className="text-white group-hover:text-white/90 transition-colors" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
