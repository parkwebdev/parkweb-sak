/**
 * Setup Feedback Toast Component
 * 
 * Floating toast-style popup in the bottom right corner for feedback.
 * Shows 5 emojis for quick rating, then optional textarea for details.
 * 
 * @module components/onboarding/SetupFeedbackToast
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from '@untitledui/icons';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { IconButton } from '@/components/ui/icon-button';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { logger } from '@/utils/logger';

const EMOJI_RATINGS = [
  { value: 1, emoji: '😞', label: 'Poor' },
  { value: 2, emoji: '😐', label: 'Fair' },
  { value: 3, emoji: '😊', label: 'Good' },
  { value: 4, emoji: '😃', label: 'Great' },
  { value: 5, emoji: '🤩', label: 'Amazing' },
];

interface SetupFeedbackToastProps {
  hasRated?: boolean;
}

export function SetupFeedbackToast({ hasRated = false }: SetupFeedbackToastProps) {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(hasRated);
  const [isDismissed, setIsDismissed] = useState(hasRated);
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

      // Show follow-up textarea instead of immediately dismissing
      setShowFollowUp(true);
    } catch (error) {
      logger.error('Failed to save rating:', error);
      setSelectedRating(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      if (feedbackText.trim()) {
        await supabase
          .from('profiles')
          .update({ setup_feedback_text: feedbackText.trim() })
          .eq('user_id', user.id);
      }
      
      setIsSubmitted(true);
      setTimeout(() => setIsDismissed(true), 2000);
    } catch (error) {
      logger.error('Failed to save feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipFeedback = () => {
    setIsSubmitted(true);
    setTimeout(() => setIsDismissed(true), 2000);
  };

  const handleDismiss = async () => {
    setIsDismissed(true);
    
    // Mark as seen so it doesn't show again
    if (user) {
      await supabase
        .from('profiles')
        .update({ setup_rating: 0 })
        .eq('user_id', user.id);
    }
  };

  if (isDismissed) return null;

  const selectedEmoji = EMOJI_RATINGS.find(e => e.value === selectedRating)?.emoji;

  return (
    <AnimatePresence>
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <div className="bg-card border border-border rounded-xl shadow-lg p-4 min-w-[280px] max-w-[320px]">
          {isSubmitted ? (
            // Final thank you state
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <div className="w-5 h-5 rounded-full bg-status-active/10 flex items-center justify-center">
                <Check size={12} className="text-status-active" />
              </div>
              <span>Thanks for your feedback!</span>
            </motion.div>
          ) : showFollowUp ? (
            // Follow-up textarea step
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedEmoji}</span>
                <span className="text-sm text-foreground font-medium">Thanks!</span>
              </div>
              <Textarea
                placeholder="Tell us more (optional)"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="min-h-[80px] text-sm resize-none"
              />
              <div className="flex gap-2 justify-end">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleSkipFeedback}
                  disabled={isSubmitting}
                >
                  Skip
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSubmitFeedback}
                  disabled={isSubmitting}
                >
                  Submit
                </Button>
              </div>
            </motion.div>
          ) : (
            // Initial emoji rating step
            <>
              <div className="flex items-start justify-between gap-2 mb-3">
                <p className="text-sm text-foreground font-medium">How was your setup experience?</p>
                <IconButton
                  label="Dismiss"
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="-mt-1 -mr-1"
                >
                  <X size={14} />
                </IconButton>
              </div>
              
              <div className="flex items-center justify-between gap-1">
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
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
