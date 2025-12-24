/**
 * useVisitorPresence Hook (Admin)
 * 
 * Tracks visitor online/offline status via Supabase Presence.
 * Used in the admin inbox to show which visitors are currently active.
 * 
 * @module hooks/useVisitorPresence
 * 
 * @example
 * ```tsx
 * const { activeVisitors, getVisitorPresence } = useVisitorPresence({ agentId });
 * const isActive = getVisitorPresence(visitorId);
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { VisitorPresenceState } from '@/types/report';

/** Options for the useVisitorPresence hook */
export interface UseVisitorPresenceOptions {
  /** Agent ID for presence channel */
  agentId: string | null | undefined;
}

/** Visitor presence data */
export interface VisitorPresenceData {
  visitorId: string;
  currentPage: string;
}

/** Return type for the useVisitorPresence hook */
export interface UseVisitorPresenceReturn {
  /** Map of active visitors by visitorId */
  activeVisitors: Record<string, VisitorPresenceData>;
  /** Get presence data for a specific visitor */
  getVisitorPresence: (visitorId: string) => VisitorPresenceData | null;
}

/**
 * Hook for tracking visitor presence in the admin inbox.
 * 
 * @param options - Configuration options for presence tracking
 * @returns Active visitors map and lookup function
 */
export function useVisitorPresence(options: UseVisitorPresenceOptions): UseVisitorPresenceReturn {
  const { agentId } = options;

  const [activeVisitors, setActiveVisitors] = useState<Record<string, VisitorPresenceData>>({});

  // Subscribe to presence for the agent to track active visitors
  useEffect(() => {
    if (!agentId) return;

    const channel = supabase
      .channel(`visitor-presence-${agentId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const visitors: Record<string, VisitorPresenceData> = {};
        
        Object.values(state).flat().forEach((rawPresence) => {
          const presence = rawPresence as unknown as VisitorPresenceState;
          if (presence.isWidgetOpen && presence.visitorId) {
            visitors[presence.visitorId] = {
              visitorId: presence.visitorId,
              currentPage: presence.currentPage || 'Unknown',
            };
          }
        });
        
        setActiveVisitors(visitors);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId]);

  // Get presence data for a specific visitor
  const getVisitorPresence = useCallback((visitorId: string): VisitorPresenceData | null => {
    return activeVisitors[visitorId] || null;
  }, [activeVisitors]);

  return {
    activeVisitors,
    getVisitorPresence,
  };
}
