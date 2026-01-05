/**
 * Knowledge Base Article Feedback Hook
 * 
 * Handles submission and retrieval of article feedback.
 * Uses session storage for anonymous user tracking.
 * 
 * @module hooks/useKBArticleFeedback
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getErrorMessage } from '@/types/errors';

/** Get or create a session ID for feedback tracking */
function getSessionId(): string {
  const key = 'kb_session_id';
  let sessionId = sessionStorage.getItem(key);
  
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(key, sessionId);
  }
  
  return sessionId;
}

/** Check if feedback was already submitted in this session */
function hasFeedbackInSession(categoryId: string, articleSlug: string): boolean {
  const key = `kb_feedback_${categoryId}_${articleSlug}`;
  return sessionStorage.getItem(key) !== null;
}

/** Get stored feedback value */
function getStoredFeedback(categoryId: string, articleSlug: string): boolean | null {
  const key = `kb_feedback_${categoryId}_${articleSlug}`;
  const value = sessionStorage.getItem(key);
  return value === null ? null : value === 'true';
}

/** Store feedback in session */
function storeFeedbackInSession(categoryId: string, articleSlug: string, isHelpful: boolean): void {
  const key = `kb_feedback_${categoryId}_${articleSlug}`;
  sessionStorage.setItem(key, isHelpful.toString());
}

interface FeedbackState {
  hasFeedback: boolean;
  isHelpful: boolean | null;
}

/**
 * Hook to manage article feedback submission
 */
export function useKBArticleFeedback(categoryId: string, articleSlug: string) {
  const [state, setState] = useState<FeedbackState>(() => ({
    hasFeedback: hasFeedbackInSession(categoryId, articleSlug),
    isHelpful: getStoredFeedback(categoryId, articleSlug),
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when article changes
  useEffect(() => {
    setState({
      hasFeedback: hasFeedbackInSession(categoryId, articleSlug),
      isHelpful: getStoredFeedback(categoryId, articleSlug),
    });
  }, [categoryId, articleSlug]);

  const submitFeedback = useCallback(async (
    isHelpful: boolean, 
    feedbackText?: string
  ): Promise<boolean> => {
    if (state.hasFeedback) return false;
    
    setIsSubmitting(true);
    
    try {
      const sessionId = getSessionId();
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('kb_article_feedback')
        .upsert({
          category_id: categoryId,
          article_slug: articleSlug,
          session_id: sessionId,
          user_id: user?.id ?? null,
          is_helpful: isHelpful,
          feedback_text: feedbackText || null,
        }, {
          onConflict: 'category_id,article_slug,session_id',
        });

      if (error) throw error;

      // Update local state
      storeFeedbackInSession(categoryId, articleSlug, isHelpful);
      setState({ hasFeedback: true, isHelpful });
      
      return true;
    } catch (error: unknown) {
      toast.error('Failed to submit feedback', { 
        description: getErrorMessage(error) 
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [categoryId, articleSlug, state.hasFeedback]);

  return {
    ...state,
    isSubmitting,
    submitFeedback,
  };
}
