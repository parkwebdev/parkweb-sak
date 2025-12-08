/**
 * useRealtimeConfig Hook
 * 
 * Subscribes to real-time changes for widget configuration (announcements, 
 * help articles, news items, etc.) and triggers config refresh when changes occur.
 * Uses debouncing to batch rapid changes into single config fetches.
 * 
 * @module widget/hooks/useRealtimeConfig
 * 
 * @example
 * ```tsx
 * useRealtimeConfig({
 *   agentId: 'agent-123',
 *   enabled: true,
 *   onConfigUpdate: (newConfig) => setConfig(newConfig)
 * });
 * ```
 */

import { useEffect, useRef, useCallback } from 'react';
import { widgetSupabase, fetchWidgetConfig, type WidgetConfig } from '../api';
import type { RealtimeChannel } from '@supabase/supabase-js';

/** Options for the useRealtimeConfig hook */
interface UseRealtimeConfigOptions {
  /** Agent ID to subscribe to */
  agentId: string;
  /** Whether real-time subscription is enabled */
  enabled: boolean;
  /** Callback when config is updated */
  onConfigUpdate: (config: WidgetConfig) => void;
}

/**
 * Hook for subscribing to real-time config changes.
 * 
 * @param options - Configuration options for the hook
 * @returns Reference to the Supabase Realtime channel
 */
export function useRealtimeConfig({ agentId, enabled, onConfigUpdate }: UseRealtimeConfigOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced config refresh to avoid multiple rapid fetches
  const refreshConfig = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(async () => {
      try {
        const newConfig = await fetchWidgetConfig(agentId);
        onConfigUpdate(newConfig);
      } catch (err) {
        console.error('Failed to refresh widget config:', err);
      }
    }, 300); // 300ms debounce to batch rapid changes
  }, [agentId, onConfigUpdate]);

  useEffect(() => {
    if (!enabled || !agentId) return;

    // Subscribe to announcements changes for this agent
    const channel = widgetSupabase
      .channel(`widget-config-${agentId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'announcements',
          filter: `agent_id=eq.${agentId}`,
        },
        () => {
          console.log('[Widget] Announcements changed, refreshing config...');
          refreshConfig();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'help_categories',
          filter: `agent_id=eq.${agentId}`,
        },
        () => {
          console.log('[Widget] Help categories changed, refreshing config...');
          refreshConfig();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'help_articles',
          filter: `agent_id=eq.${agentId}`,
        },
        () => {
          console.log('[Widget] Help articles changed, refreshing config...');
          refreshConfig();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'agents',
          filter: `id=eq.${agentId}`,
        },
        () => {
          console.log('[Widget] Agent config changed, refreshing config...');
          refreshConfig();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Widget] Real-time config subscription active');
        }
      });

    channelRef.current = channel;

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (channelRef.current) {
        widgetSupabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [agentId, enabled, refreshConfig]);

  return channelRef;
}
