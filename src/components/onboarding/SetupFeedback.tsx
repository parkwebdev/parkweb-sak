/**
 * Setup Feedback Component
 * 
 * Simple 5-emoji rating for the setup experience.
 * Only shows if user hasn't rated yet.
 * 
 * @module components/onboarding/SetupFeedback
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check } from '@untitledui/icons';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';

const EMOJI_RATINGS = [
  { value: 1, emoji: '😞', label: 'Poor' },
  { value: 2, emoji: '😐', label: 'Fair' },
  { value: 3, emoji: '😊', label: 'Good' },
  { value: 4, emoji: '😃', label: 'Great' },
  { value: 5, emoji: '🤩', label: 'Amazing' },
];

interface SetupFeedbackProps {
  hasRated?: boolean;
}

export const SetupFeedback: React.FC<SetupFeedbackProps> = ({ hasRated = false }) => {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(hasRated);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRating = async (rating: number) => {
    if (!user || isSubmitting) return;

    setSelectedRating(rating);
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ setup_rating: rating })
        .eq('user_id', user.id);

      if (error) throw error;

      setIsSubmitted(true);
    } catch (error) {
      logger.error('Failed to save rating:', error);
      toast.error('Failed to save feedback');
      setSelectedRating(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground"
      >
        <div className="w-5 h-5 rounded-full bg-status-active/10 flex items-center justify-center">
          <Check size={12} className="text-status-active" />
        </div>
        <span>Thanks for your feedback!</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.3 }}
      className="flex flex-col items-center py-4"
    >
      <p className="text-sm text-muted-foreground mb-3">How was your setup experience?</p>
      
      <div className="flex items-center gap-2">
        {EMOJI_RATINGS.map(({ value, emoji, label }) => (
          <motion.button
            key={value}
            whileHover={prefersReducedMotion ? {} : { scale: 1.15 }}
            whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
            onClick={() => handleRating(value)}
            disabled={isSubmitting}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center text-xl
              transition-all duration-200
              ${selectedRating === value 
                ? 'bg-primary/20 ring-2 ring-primary' 
                : 'hover:bg-accent'
              }
              ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            title={label}
          >
            {emoji}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};
