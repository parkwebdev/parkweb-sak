/**
 * Help Center Article Feedback Component
 * 
 * Displays a "Was this helpful?" prompt and collects user feedback.
 * Optionally allows users to provide additional text feedback.
 * 
 * @module components/help-center/HCArticleFeedback
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ThumbsUp, ThumbsDown } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useHCArticleFeedback } from '@/hooks/useHCArticleFeedback';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springs } from '@/lib/motion-variants';

interface HCArticleFeedbackProps {
  categoryId: string;
  articleSlug: string;
}

export function HCArticleFeedback({ categoryId, articleSlug }: HCArticleFeedbackProps) {
  const { hasFeedback, isHelpful, isSubmitting, submitFeedback } = useHCArticleFeedback(
    categoryId, 
    articleSlug
  );
  const [showTextarea, setShowTextarea] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [pendingHelpful, setPendingHelpful] = useState<boolean | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const handleFeedback = async (helpful: boolean) => {
    if (helpful) {
      // Positive feedback - submit immediately
      await submitFeedback(helpful);
    } else {
      // Negative feedback - show textarea for more details
      setPendingHelpful(helpful);
      setShowTextarea(true);
    }
  };

  const handleSubmitWithText = async () => {
    if (pendingHelpful !== null) {
      await submitFeedback(pendingHelpful, feedbackText.trim() || undefined);
      setShowTextarea(false);
      setFeedbackText('');
      setPendingHelpful(null);
    }
  };

  const handleSkip = async () => {
    if (pendingHelpful !== null) {
      await submitFeedback(pendingHelpful);
      setShowTextarea(false);
      setFeedbackText('');
      setPendingHelpful(null);
    }
  };

  // Already submitted
  if (hasFeedback) {
    return (
      <div className="border-t border-border pt-6 mt-8">
        <motion.div 
          className="flex items-center gap-2 text-sm text-muted-foreground"
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springs.smooth}
        >
          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-status-active/10">
            <Check size={12} className="text-status-active" aria-hidden="true" />
          </div>
          <span>
            Thanks for your feedback!
            {isHelpful !== null && (
              <span className="text-muted-foreground/60">
                {' '}— You found this {isHelpful ? 'helpful' : 'not helpful'}
              </span>
            )}
          </span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="border-t border-border pt-6 mt-8">
      <AnimatePresence mode="wait">
        {!showTextarea ? (
          <motion.div
            key="buttons"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? {} : { opacity: 0 }}
            transition={springs.smooth}
          >
            <p className="text-sm font-medium text-foreground mb-3">
              Was this article helpful?
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFeedback(true)}
                disabled={isSubmitting}
                className="gap-1.5"
              >
                <ThumbsUp size={14} aria-hidden="true" />
                Yes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFeedback(false)}
                disabled={isSubmitting}
                className="gap-1.5"
              >
                <ThumbsDown size={14} aria-hidden="true" />
                No
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="textarea"
            className="space-y-3"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? {} : { opacity: 0 }}
            transition={springs.smooth}
          >
            <p className="text-sm font-medium text-foreground">
              What could we improve?
            </p>
            <Textarea
              placeholder="Tell us how we can make this article better (optional)"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleSubmitWithText}
                loading={isSubmitting}
              >
                Submit Feedback
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                disabled={isSubmitting}
              >
                Skip
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
