/**
 * useVisitorPresence Hook
 * 
 * Broadcasts visitor presence to the admin panel via Supabase Presence.
 * Enables real-time "active visitors" display in admin conversations view.
 * 
 * @module widget/hooks/useVisitorPresence
 * 
 * @example
 * ```tsx
 * const presenceRef = useVisitorPresence({
 *   agentId: 'agent-123',
 *   visitorId: 'visitor-456',
 *   isOpen: true,
 *   previewMode: false,
 *   config,
 *   chatUser
 * });
 * ```
 */

import { useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { startVisitorPresence, updateVisitorPresence, stopVisitorPresence, type WidgetConfig } from '../api';
import type { ChatUser } from '../types';

/** Options for the useVisitorPresence hook */
interface UseVisitorPresenceOptions {
  /** Agent ID for presence channel */
  agentId: string;
  /** Unique visitor identifier */
  visitorId: string;
  /** Whether widget panel is open */
  isOpen: boolean;
  /** Whether widget is in preview/editor mode */
  previewMode: boolean;
  /** Widget configuration (null during loading) */
  config: WidgetConfig | null;
  /** Current chat user information */
  chatUser: ChatUser | null;
}

/**
 * Hook for broadcasting visitor presence to admin panel.
 * 
 * @param options - Configuration options for presence tracking
 * @returns Reference to the Supabase Presence channel
 */
export function useVisitorPresence(options: UseVisitorPresenceOptions) {
  const {
    agentId,
    visitorId,
    isOpen,
    previewMode,
    config,
    chatUser,
  } = options;

  const presenceChannelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (previewMode || !config) return;
    
    const currentPage = window.location.href;
    
    // Start presence when widget opens
    if (isOpen && !presenceChannelRef.current) {
      presenceChannelRef.current = startVisitorPresence(agentId, visitorId, {
        currentPage,
        isWidgetOpen: true,
        leadName: chatUser?.firstName ? `${chatUser.firstName} ${chatUser.lastName}`.trim() : undefined,
        leadEmail: chatUser?.email,
      });
    }
    
    // Update presence when page changes or widget state changes
    if (presenceChannelRef.current) {
      updateVisitorPresence(presenceChannelRef.current, visitorId, {
        currentPage,
        isWidgetOpen: isOpen,
        leadName: chatUser?.firstName ? `${chatUser.firstName} ${chatUser.lastName}`.trim() : undefined,
        leadEmail: chatUser?.email,
      });
    }
    
    // Stop presence when widget closes
    if (!isOpen && presenceChannelRef.current) {
      stopVisitorPresence(presenceChannelRef.current);
      presenceChannelRef.current = null;
    }
    
    return () => {
      if (presenceChannelRef.current) {
        stopVisitorPresence(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }
    };
  }, [isOpen, agentId, visitorId, chatUser, previewMode, config]);

  return presenceChannelRef;
}
