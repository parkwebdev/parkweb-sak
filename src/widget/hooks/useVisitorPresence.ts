/**
 * useVisitorPresence Hook
 * 
 * Broadcasts visitor presence to admin panel.
 */

import { useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { startVisitorPresence, updateVisitorPresence, stopVisitorPresence, type WidgetConfig } from '../api';
import type { ChatUser } from '../types';

interface UseVisitorPresenceOptions {
  agentId: string;
  visitorId: string;
  isOpen: boolean;
  previewMode: boolean;
  config: WidgetConfig | null;
  chatUser: ChatUser | null;
}

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
