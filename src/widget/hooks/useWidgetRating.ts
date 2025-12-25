/**
 * Widget Rating Hook
 * 
 * Manages satisfaction rating prompt state and logic.
 * Ensures rating is only shown once per session and tracks trigger type.
 * 
 * @module widget/hooks/useWidgetRating
 * 
 * @example
 * ```tsx
 * const {
 *   showRatingPrompt,
 *   ratingTriggerType,
 *   triggerRating,
 *   dismissRating,
 *   hasShownRatingRef,
 * } = useWidgetRating();
 * ```
 */
import { useState, useRef, useCallback } from 'react';
import { widgetLogger } from '../utils/widget-logger';

// ============================================================================
// Types
// ============================================================================

/** Types of events that can trigger the rating prompt */
export type RatingTriggerType = 'team_closed' | 'ai_marked_complete';

export interface UseWidgetRatingReturn {
  /** Whether the rating prompt is currently visible */
  showRatingPrompt: boolean;
  /** Set rating prompt visibility directly */
  setShowRatingPrompt: (value: boolean) => void;
  /** The type of event that triggered the rating */
  ratingTriggerType: RatingTriggerType;
  /** Set rating trigger type directly */
  setRatingTriggerType: (type: RatingTriggerType) => void;
  /** Trigger the rating prompt (respects hasShownRating) */
  triggerRating: (type: RatingTriggerType) => void;
  /** Dismiss the rating prompt */
  dismissRating: () => void;
  /** Ref tracking if rating was shown this session */
  hasShownRatingRef: React.MutableRefObject<boolean>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useWidgetRating(): UseWidgetRatingReturn {
  // === State ===
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  const [ratingTriggerType, setRatingTriggerType] = useState<RatingTriggerType>('ai_marked_complete');
  
  // === Refs ===
  /** Track if rating has been shown to prevent duplicate prompts */
  const hasShownRatingRef = useRef(false);

  // === Handlers ===
  
  /**
   * Trigger the rating prompt if not already shown
   * @param type - The type of event triggering the rating
   */
  const triggerRating = useCallback((type: RatingTriggerType) => {
    if (hasShownRatingRef.current) {
      widgetLogger.debug('Rating already shown this session, skipping');
      return;
    }
    
    widgetLogger.info('Triggering rating prompt', { type });
    setRatingTriggerType(type);
    setShowRatingPrompt(true);
    hasShownRatingRef.current = true;
  }, []);

  /**
   * Dismiss the rating prompt
   */
  const dismissRating = useCallback(() => {
    setShowRatingPrompt(false);
    widgetLogger.debug('Rating prompt dismissed');
  }, []);

  return {
    showRatingPrompt,
    setShowRatingPrompt,
    ratingTriggerType,
    setRatingTriggerType,
    triggerRating,
    dismissRating,
    hasShownRatingRef,
  };
}
