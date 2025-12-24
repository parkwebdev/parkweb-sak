/**
 * useVisitorAnalytics Hook
 * 
 * Tracks page visits, referrer journey, and UTM parameters for analytics.
 * Persists data to localStorage and syncs with server for conversation metadata.
 * 
 * @module widget/hooks/useVisitorAnalytics
 * 
 * @example
 * ```tsx
 * const {
 *   pageVisits,
 *   referrerJourney,
 *   setReferrerJourney,
 *   currentPageRef
 * } = useVisitorAnalytics({
 *   agentId: 'agent-123',
 *   visitorId: 'visitor-456',
 *   previewMode: false,
 *   activeConversationId: 'conv-789'
 * });
 * ```
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { detectEntryType, parseUtmParams, isValidUUID } from '../utils';
import { updatePageVisit, type ReferrerJourney } from '../api';
import { isInternalWidgetUrl } from '../constants';
import type { PageVisit } from '../types';
import { logger } from '@/utils/logger';

/** Options for the useVisitorAnalytics hook */
interface UseVisitorAnalyticsOptions {
  /** Agent ID for localStorage key namespacing */
  agentId: string;
  /** Unique visitor identifier */
  visitorId: string;
  /** Whether widget is in preview/editor mode */
  previewMode: boolean;
  /** Active conversation ID for real-time updates */
  activeConversationId: string | null;
}

/**
 * Hook for tracking visitor analytics data.
 * 
 * @param options - Configuration options for the hook
 * @returns Analytics state, setters, and refs
 */
export function useVisitorAnalytics(options: UseVisitorAnalyticsOptions) {
  const { agentId, visitorId, previewMode, activeConversationId } = options;
  
  const [pageVisits, setPageVisits] = useState<PageVisit[]>([]);
  const [referrerJourney, setReferrerJourney] = useState<ReferrerJourney | null>(null);
  const referrerJourneySentRef = useRef(false);
  const currentPageRef = useRef<{ url: string; entered_at: string }>({ url: '', entered_at: '' });
  
  // Parent page URL tracking (for iframe mode)
  const parentPageUrlRef = useRef<string | null>(null);
  const parentReferrerRef = useRef<string | null>(null);
  const parentUtmParamsRef = useRef<Partial<ReferrerJourney> | null>(null);
  
  // Browser language preference (e.g., "es", "es-ES", "pt-BR")
  const browserLanguageRef = useRef<string | null>(null);

  // Helper function to capture referrer journey from window.location (fallback)
  const captureReferrerJourneyFallback = useCallback(() => {
    if (referrerJourney) return;
    
    const currentUrl = window.location.href;
    const referrer = document.referrer || null;
    const utmParams = parseUtmParams(currentUrl);
    
    // Determine entry type (UTM params can override referrer-based detection)
    let entryType = utmParams.entry_type || detectEntryType(referrer);
    
    const journey: ReferrerJourney = {
      referrer_url: referrer,
      landing_page: currentUrl,
      utm_source: utmParams.utm_source || null,
      utm_medium: utmParams.utm_medium || null,
      utm_campaign: utmParams.utm_campaign || null,
      utm_term: utmParams.utm_term || null,
      utm_content: utmParams.utm_content || null,
      entry_type: entryType,
    };
    
    setReferrerJourney(journey);
    logger.debug('[Widget] Captured referrer journey (fallback):', journey);
    
    // Persist to localStorage
    localStorage.setItem(`chatpad_referrer_journey_${agentId}`, JSON.stringify(journey));
  }, [agentId, referrerJourney]);

  // Capture referrer journey on initial load (fallback for non-iframe mode)
  useEffect(() => {
    if (previewMode || referrerJourney) return;
    
    // In iframe mode, wait for parent to send page info
    const isInIframe = window.parent !== window;
    if (isInIframe) {
      // Give parent 1 second to send page info before falling back
      const timeout = setTimeout(() => {
        if (!parentPageUrlRef.current && !referrerJourney) {
          logger.debug('[Widget] No parent page info received, using fallback');
          captureReferrerJourneyFallback();
        }
      }, 1000);
      return () => clearTimeout(timeout);
    }
    
    // Not in iframe, capture directly
    captureReferrerJourneyFallback();
  }, [agentId, previewMode, referrerJourney, captureReferrerJourneyFallback]);

  // Load referrer journey from localStorage on mount
  useEffect(() => {
    if (previewMode || referrerJourney) return;
    const stored = localStorage.getItem(`chatpad_referrer_journey_${agentId}`);
    if (stored) {
      try {
        setReferrerJourney(JSON.parse(stored));
      } catch { /* ignore */ }
    }
  }, [agentId, previewMode, referrerJourney]);

  // Page visit tracking - only for non-iframe mode (iframe mode handled by parent message listener)
  useEffect(() => {
    if (previewMode) return; // Don't track in preview mode
    
    // In iframe mode, page tracking is handled by parent postMessage
    const isInIframe = window.parent !== window;
    if (isInIframe) return;
    
    const trackPageVisit = (sendRealtime = false) => {
      const now = new Date().toISOString();
      const currentUrl = window.location.href;
      
      // Skip tracking if this is the widget.html page itself
      if (isInternalWidgetUrl(currentUrl)) {
        logger.debug('[Widget] Skipping internal widget URL in fallback:', currentUrl);
        return;
      }
      
      // Calculate duration for previous page
      let previousDuration = 0;
      if (currentPageRef.current.url && currentPageRef.current.entered_at) {
        previousDuration = Date.now() - new Date(currentPageRef.current.entered_at).getTime();
        setPageVisits(prev => {
          // Update the last visit with duration
          const updated = [...prev];
          const lastIndex = updated.findIndex(v => v.url === currentPageRef.current.url && v.duration_ms === 0);
          if (lastIndex !== -1) {
            updated[lastIndex] = { ...updated[lastIndex], duration_ms: previousDuration };
          }
          return updated;
        });
      }
      
      // Start tracking new page
      currentPageRef.current = { url: currentUrl, entered_at: now };
      const newVisit = { url: currentUrl, entered_at: now, duration_ms: 0 };
      setPageVisits(prev => [...prev, newVisit]);
      
      // Send real-time update if we have an active conversation
      if (sendRealtime && isValidUUID(activeConversationId)) {
        updatePageVisit(activeConversationId, {
          ...newVisit,
          previous_duration_ms: previousDuration,
        }, undefined, visitorId).catch(err => logger.error('[Widget] Failed to send real-time page visit:', err));
      }
    };
    
    // Track initial page (don't send real-time on initial load)
    trackPageVisit(false);
    
    // Track SPA navigations (send real-time)
    const handlePopState = () => trackPageVisit(true);
    const handleHashChange = () => trackPageVisit(true);
    
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handleHashChange);
    
    // Update duration on unload
    const handleBeforeUnload = () => {
      if (currentPageRef.current.url && currentPageRef.current.entered_at) {
        const duration = Date.now() - new Date(currentPageRef.current.entered_at).getTime();
        // Try to update localStorage with final duration (best effort)
        try {
          const stored = localStorage.getItem(`chatpad_page_visits_${agentId}`);
          if (stored) {
            const visits = JSON.parse(stored);
            const lastIndex = visits.findIndex((v: PageVisit) => v.url === currentPageRef.current.url && v.duration_ms === 0);
            if (lastIndex !== -1) {
              visits[lastIndex].duration_ms = duration;
              localStorage.setItem(`chatpad_page_visits_${agentId}`, JSON.stringify(visits));
            }
          }
        } catch { /* ignore */ }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [agentId, previewMode, activeConversationId, visitorId]);

  // Persist page visits to localStorage
  useEffect(() => {
    if (pageVisits.length > 0 && !previewMode) {
      localStorage.setItem(`chatpad_page_visits_${agentId}`, JSON.stringify(pageVisits));
    }
  }, [pageVisits, agentId, previewMode]);

  // Load page visits from localStorage on mount
  useEffect(() => {
    if (previewMode) return;
    const stored = localStorage.getItem(`chatpad_page_visits_${agentId}`);
    if (stored) {
      try {
        setPageVisits(JSON.parse(stored));
      } catch { /* ignore */ }
    }
  }, [agentId, previewMode]);

  // Send referrer journey to server when conversation is first created
  useEffect(() => {
    if (previewMode || !activeConversationId || referrerJourneySentRef.current || !referrerJourney) return;
    
    // Only send for valid database conversation IDs
    if (!isValidUUID(activeConversationId)) return;
    
    // Send referrer journey once when conversation is created
    updatePageVisit(activeConversationId, {
      url: referrerJourney.landing_page,
      entered_at: new Date().toISOString(),
      duration_ms: 0,
    }, referrerJourney, visitorId).then(() => {
      referrerJourneySentRef.current = true;
      logger.debug('[Widget] Sent referrer journey to server');
    }).catch(err => logger.error('[Widget] Failed to send referrer journey:', err));
  }, [activeConversationId, referrerJourney, previewMode, visitorId]);

  return {
    pageVisits,
    setPageVisits,
    referrerJourney,
    setReferrerJourney,
    currentPageRef,
    parentPageUrlRef,
    parentReferrerRef,
    parentUtmParamsRef,
    browserLanguageRef,
  };
}
