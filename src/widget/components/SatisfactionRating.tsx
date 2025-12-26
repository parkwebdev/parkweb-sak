/**
 * SatisfactionRating Component
 * 
 * Displays a 1-5 star rating prompt with optional feedback text.
 * Shows when conversation is closed by team or AI marks it complete.
 */
import { useState } from 'react';
import { Star01, XClose } from '../icons';
import { useSystemTheme } from '../hooks/useSystemTheme';

interface SatisfactionRatingProps {
  conversationId: string;
  triggerType: 'team_closed' | 'ai_marked_complete';
  primaryColor: string;
  onSubmit: (rating: number, feedback?: string) => Promise<void>;
  onDismiss: () => void;
}

export const SatisfactionRating = ({
  conversationId,
  triggerType,
  primaryColor,
  onSubmit,
  onDismiss,
}: SatisfactionRatingProps) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const systemTheme = useSystemTheme();

  // Theme-aware colors using CSS custom properties: white in dark mode, primaryColor in light mode
  const accentColor = systemTheme === 'dark' ? 'hsl(0 0% 100%)' : primaryColor;
  const buttonTextColor = systemTheme === 'dark' ? 'hsl(0 0% 0%)' : 'hsl(0 0% 100%)';

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(rating, feedback.trim() || undefined);
      setIsSubmitted(true);
      // Auto dismiss after 2 seconds
      setTimeout(onDismiss, 2000);
    } catch (error) {
      // Rating error handled silently in production
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  if (isSubmitted) {
    return (
      <div className="absolute inset-x-0 bottom-0 bg-background border-t border-border p-4 widget-message-slide-left">
        <div className="text-center py-4">
          <div className="text-2xl mb-2">🎉</div>
          <p className="text-sm font-medium text-foreground">Thank you for your feedback!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-x-0 bottom-0 bg-background border-t border-border p-4 shadow-lg widget-message-slide-left">
      {/* Close button */}
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Dismiss"
      >
        <XClose className="w-4 h-4 text-muted-foreground" />
      </button>

      <div className="space-y-4">
        {/* Title */}
        <div className="text-center pr-6">
          <p className="text-sm font-medium text-foreground">
            How was your experience?
          </p>
        </div>

        {/* Star Rating */}
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
              aria-label={`Rate ${star} stars`}
            >
              <Star01
                className="w-8 h-8 transition-colors"
                style={{
                  fill: star <= (hoveredRating || rating) ? accentColor : 'transparent',
                  stroke: star <= (hoveredRating || rating) ? accentColor : 'hsl(var(--muted-foreground))',
                }}
              />
            </button>
          ))}
        </div>

        {/* Rating label - always reserve space to prevent layout shift */}
        <div className="h-5 text-center">
          {(hoveredRating || rating) > 0 && (
            <p className="text-sm text-muted-foreground">
              {ratingLabels[hoveredRating || rating]}
            </p>
          )}
        </div>

        {/* Feedback textarea - only show after rating selected */}
        {rating > 0 && (
          <div className="space-y-3 animate-fade-in">
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us more (optional)"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              rows={2}
              maxLength={500}
            />

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              style={{ backgroundColor: accentColor, color: buttonTextColor }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
