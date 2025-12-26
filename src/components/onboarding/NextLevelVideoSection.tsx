/**
 * Next Level Video Section Component
 * 
 * Full-width video section for advanced tutorials/tips.
 * 
 * @module components/onboarding/NextLevelVideoSection
 */

import React, { useState } from 'react';
import { PlayCircle, Star01 } from '@untitledui/icons';
import { motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { logger } from '@/utils/logger';

export const NextLevelVideoSection: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    // TODO: Open video modal or start playback
    setIsPlaying(true);
    logger.debug('Play next level video');
  };

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.3 }}
      className="rounded-lg border border-border overflow-hidden"
    >
      {/* Video container with gradient background */}
      <div 
        className="relative aspect-video max-h-48 bg-gradient-to-br from-violet-500/20 via-purple-500/15 to-indigo-500/20 flex items-center justify-center cursor-pointer group"
        onClick={handlePlay}
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>

        {/* Play button */}
        <motion.button
          whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
          whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
          className="relative z-10 w-16 h-16 rounded-full bg-background/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-primary group-hover:bg-background transition-colors"
        >
          <PlayCircle size={32} />
        </motion.button>

        {/* Duration badge */}
        <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-background/80 backdrop-blur-sm text-xs text-muted-foreground">
          3:24
        </div>
      </div>

      {/* Content section */}
      <div className="p-4 bg-card">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent-purple/10 flex items-center justify-center text-accent-purple">
            <Star01 size={16} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground mb-0.5">Level up your skills</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Learn advanced tips and tricks to get the most out of Ari and boost your team's productivity.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
