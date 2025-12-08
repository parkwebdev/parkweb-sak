/**
 * useParentMessages Hook
 * 
 * Handles postMessage communication with parent window in iframe mode.
 * Listens for open/close commands, page info updates, and notifies parent of events.
 * 
 * @module widget/hooks/useParentMessages
 * 
 * @example
 * ```tsx
 * const { notifyUnreadCount, notifyClose } = useParentMessages(
 *   {
 *     previewMode: false,
 *     agentId: 'agent-123',
 *     visitorId: 'visitor-456',
 *     activeConversationId: 'conv-789',
 *     referrerJourney: null,
 *     setIsOpen,
 *     setReferrerJourney,
 *     setPageVisits
 *   },
 *   { parentPageUrlRef, parentReferrerRef, parentUtmParamsRef, currentPageRef }
 * );
 * ```
 */

import { useEffect, useRef, useCallback } from 'react';
import { detectEntryType, parseUtmParams, isValidUUID } from '../utils';
import { updatePageVisit, type ReferrerJourney } from '../api';
import { isInternalWidgetUrl } from '../constants';
import type { PageVisit } from '../types';

/** Options for the useParentMessages hook */
interface UseParentMessagesOptions {
  /** Whether widget is in preview/editor mode */
  previewMode: boolean;
  /** Agent ID for analytics */
  agentId: string;
  /** Unique visitor identifier */
  visitorId: string;
  /** Active conversation ID (UUID format) */
  activeConversationId: string | null;
  /** Current referrer journey data */
  referrerJourney: ReferrerJourney | null;
  /** Setter for widget open state */
  setIsOpen: (open: boolean) => void;
  /** Setter for referrer journey data */
  setReferrerJourney: (journey: ReferrerJourney) => void;
  /** State setter for page visits array */
  setPageVisits: React.Dispatch<React.SetStateAction<PageVisit[]>>;
}

/** Refs for tracking parent page information */
interface ParentPageRefs {
  /** Ref for current parent page URL */
  parentPageUrlRef: React.MutableRefObject<string | null>;
  /** Ref for parent document referrer */
  parentReferrerRef: React.MutableRefObject<string | null>;
  /** Ref for UTM parameters from parent */
  parentUtmParamsRef: React.MutableRefObject<Partial<ReferrerJourney> | null>;
  /** Ref for current page tracking */
  currentPageRef: React.MutableRefObject<{ url: string; entered_at: string }>;
}

/**
 * Hook for handling postMessage communication with parent window.
 * 
 * @param options - Configuration options for the hook
 * @param refs - Refs for tracking parent page information
 * @returns Functions to notify parent of events
 */
export function useParentMessages(
  options: UseParentMessagesOptions,
  refs: ParentPageRefs
) {
  const {
    previewMode,
    agentId,
    visitorId,
    activeConversationId,
    referrerJourney,
    setIsOpen,
    setReferrerJourney,
    setPageVisits,
  } = options;

  const {
    parentPageUrlRef,
    parentReferrerRef,
    parentUtmParamsRef,
    currentPageRef,
  } = refs;

  // Listen for parent page info messages (iframe mode - parent sends real page URL)
  useEffect(() => {
    if (previewMode) return;
    
    const handleParentMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;
      
      if (event.data.type === 'chatpad-parent-page-info') {
        const { url, referrer, utmParams } = event.data;
        console.log('[Widget] Received parent page info:', { url, referrer, utmParams });
        
        // Skip tracking if this is the widget.html page itself
        if (isInternalWidgetUrl(url)) {
          console.log('[Widget] Skipping internal widget URL:', url);
          return;
        }
        
        const isFirstMessage = !parentPageUrlRef.current;
        parentPageUrlRef.current = url;
        parentReferrerRef.current = referrer;
        parentUtmParamsRef.current = utmParams || {};
        
        // If this is the first parent page info, set up referrer journey
        if (isFirstMessage && !referrerJourney) {
          const entryType = (utmParams?.utm_medium && ['cpc', 'ppc', 'paid', 'cpm', 'display', 'retargeting'].includes(utmParams.utm_medium.toLowerCase())) 
            ? 'paid' 
            : detectEntryType(referrer);
          
          const journey: ReferrerJourney = {
            referrer_url: referrer || null,
            landing_page: url,
            utm_source: utmParams?.utm_source || null,
            utm_medium: utmParams?.utm_medium || null,
            utm_campaign: utmParams?.utm_campaign || null,
            utm_term: utmParams?.utm_term || null,
            utm_content: utmParams?.utm_content || null,
            entry_type: entryType,
          };
          
          setReferrerJourney(journey);
          console.log('[Widget] Set referrer journey from parent:', journey);
          localStorage.setItem(`chatpad_referrer_journey_${agentId}`, JSON.stringify(journey));
        }
        
        // Track page visit with parent URL
        if (url) {
          const now = new Date().toISOString();
          
          // Calculate duration for previous page
          let previousDuration = 0;
          if (currentPageRef.current.url && currentPageRef.current.entered_at) {
            previousDuration = Date.now() - new Date(currentPageRef.current.entered_at).getTime();
            setPageVisits(prev => {
              const updated = [...prev];
              const lastIndex = updated.findIndex(v => v.url === currentPageRef.current.url && v.duration_ms === 0);
              if (lastIndex !== -1) {
                updated[lastIndex] = { ...updated[lastIndex], duration_ms: previousDuration };
              }
              return updated;
            });
          }
          
          // Only add new page visit if URL changed
          if (url !== currentPageRef.current.url) {
            currentPageRef.current = { url, entered_at: now };
            const newVisit = { url, entered_at: now, duration_ms: 0 };
            setPageVisits(prev => [...prev, newVisit]);
            
            // Send real-time update if we have an active conversation
            if (isValidUUID(activeConversationId)) {
              updatePageVisit(activeConversationId, {
                ...newVisit,
                previous_duration_ms: previousDuration,
              }, undefined, visitorId).catch(err => console.error('[Widget] Failed to send real-time page visit:', err));
            }
          }
        }
      }
    };
    
    window.addEventListener('message', handleParentMessage);
    return () => window.removeEventListener('message', handleParentMessage);
  }, [agentId, previewMode, referrerJourney, activeConversationId, visitorId]);

  // Listen for open/close commands from parent
  useEffect(() => {
    if (previewMode) return;

    const handleParentMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;

      switch (event.data.type) {
        case 'chatpad-widget-opened':
          setIsOpen(true);
          break;
        case 'chatpad-widget-closed':
          setIsOpen(false);
          break;
      }
    };

    window.addEventListener('message', handleParentMessage);
    return () => window.removeEventListener('message', handleParentMessage);
  }, [previewMode, setIsOpen]);

  // Signal to parent that widget is ready to display (eliminates flicker on first open)
  useEffect(() => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'chatpad-widget-ready' }, '*');
    }
  }, []);

  // Notify parent of unread count
  const notifyUnreadCount = useCallback((count: number) => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'chatpad-unread-count', count }, '*');
    }
  }, []);

  // Notify parent to close widget
  const notifyClose = useCallback(() => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'chatpad-widget-close' }, '*');
    }
  }, []);

  return {
    notifyUnreadCount,
    notifyClose,
  };
}
