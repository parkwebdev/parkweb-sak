/**
 * Video Placeholder Component
 * 
 * Displays a styled placeholder for tutorial videos in the preview panel.
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

const STEP_VIDEO_TITLES: Record<string, string> = {
  personality: 'How to write a system prompt',
  knowledge: 'Adding your first knowledge source',
  appearance: 'Customizing your widget colors',
  installation: 'Copying the embed code',
  test: 'Your first conversation with Ari',
};

export const VideoPlaceholder: React.FC<VideoPlaceholderProps> = ({
  stepId,
  title,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const gradient = STEP_GRADIENTS[stepId] || STEP_GRADIENTS.test;
  const videoTitle = title || STEP_VIDEO_TITLES[stepId] || 'Watch tutorial';

  return (
    <div className="relative aspect-video rounded-xl overflow-hidden border border-border">
      {/* Gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      
      {/* Subtle pattern overlay */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--muted-foreground) / 0.15) 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Play button */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          className="w-16 h-16 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-lg border border-border cursor-pointer group"
          whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
          whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
          role="button"
          tabIndex={0}
        >
          <PlayCircle size={28} className="text-foreground" />
        </motion.div>
        
        <div className="mt-4 text-center">
          <p className="text-sm font-medium text-foreground">{videoTitle}</p>
          <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
        </div>
      </div>
    </div>
  );
};
