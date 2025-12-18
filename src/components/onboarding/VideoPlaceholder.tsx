/**
 * Video Placeholder Component
 * 
 * Compact video placeholder for inline display within step cards.
 * Shows step-specific gradients and supports future video integration.
 * 
 * @module components/onboarding/VideoPlaceholder
 */

import React from 'react';
import { motion } from 'motion/react';
import { PlayCircle } from '@untitledui/icons';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface VideoPlaceholderProps {
  stepId: string;
  title?: string;
}

/**
 * Step-specific gradient configurations
 */
const STEP_GRADIENTS: Record<string, string> = {
  personality: 'from-purple-500/20 via-pink-500/20 to-purple-600/20',
  knowledge: 'from-blue-500/20 via-teal-500/20 to-cyan-500/20',
  appearance: 'from-orange-500/20 via-yellow-500/20 to-amber-500/20',
  installation: 'from-emerald-500/20 via-green-500/20 to-teal-500/20',
  test: 'from-primary/20 via-primary/15 to-primary/20',
};

export const VideoPlaceholder: React.FC<VideoPlaceholderProps> = ({
  stepId,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const gradient = STEP_GRADIENTS[stepId] || STEP_GRADIENTS.test;

  return (
    <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-muted/30">
      {/* Gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      
      {/* Subtle pattern overlay */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--muted-foreground) / 0.2) 1px, transparent 0)`,
          backgroundSize: '16px 16px',
        }}
      />

      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-md border border-border/50 cursor-pointer"
          whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
          whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
          role="button"
          tabIndex={0}
          aria-label="Play tutorial video"
        >
          <PlayCircle size={20} className="text-foreground" />
        </motion.div>
      </div>
    </div>
  );
};
