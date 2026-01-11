/**
 * Realtime Manager
 * 
 * Centralized manager for Supabase real-time subscriptions.
 * Consolidates multiple table subscriptions into a single channel
 * to reduce connection overhead and improve performance.
 * 
 * @module lib/realtime-manager
 * @see docs/DEVELOPMENT_STANDARDS.md
 */

import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/** Subscription configuration for a table */
export interface TableSubscription {
  table: string;
  schema?: string;
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
}

/** Callback for realtime events */
export type RealtimeCallback = (
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>
) => void;

/** Subscription reference for unsubscribing */
interface SubscriptionRef {
  table: string;
  filter?: string;
  callback: RealtimeCallback;
}

/** Active channel info */
interface ChannelInfo {
  channel: RealtimeChannel;
  subscriptionCount: number;
}

/**
 * Singleton manager for Supabase real-time subscriptions.
 * 
 * Benefits:
 * - Separate channels per table/filter combination (Supabase requirement)
 * - Automatic cleanup on unsubscribe
 * - Prevents ERR_INSUFFICIENT_RESOURCES errors
 * - Supports multiple callbacks per table
 * 
 * @example
 * ```tsx
 * const manager = RealtimeManager.getInstance();
 * 
 * useEffect(() => {
 *   const unsubscribe = manager.subscribe(
 *     { table: 'leads', filter: `user_id=eq.${userId}` },
 *     (payload) => {
 *       queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
 *     },
 *     userId
 *   );
 *   
 *   return () => unsubscribe();
 * }, [userId]);
 * ```
 */
class RealtimeManagerClass {
  private static instance: RealtimeManagerClass | null = null;
  private channels: Map<string, ChannelInfo> = new Map();
  private subscriptions: Map<string, Set<SubscriptionRef>> = new Map();

  private constructor() {}

  /** Get singleton instance */
  static getInstance(): RealtimeManagerClass {
    if (!RealtimeManagerClass.instance) {
      RealtimeManagerClass.instance = new RealtimeManagerClass();
    }
    return RealtimeManagerClass.instance;
  }

  /** Generate unique key for subscription */
  private getSubscriptionKey(config: TableSubscription): string {
    return `${config.schema || 'public'}.${config.table}:${config.filter || '*'}:${config.event || '*'}`;
  }

  /**
   * Subscribe to table changes.
   * Multiple callbacks can subscribe to the same table/filter.
   * 
   * @param config - Table subscription configuration
   * @param callback - Function called on change events
   * @param userId - User ID for channel naming (for cleanup)
   * @returns Unsubscribe function
   */
  subscribe(
    config: TableSubscription,
    callback: RealtimeCallback,
    userId: string
  ): () => void {
    if (!userId) {
      console.warn('[RealtimeManager] Cannot subscribe without userId');
      return () => {};
    }

    const key = this.getSubscriptionKey(config);
    const ref: SubscriptionRef = { table: config.table, filter: config.filter, callback };

    // Track subscription
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }
    this.subscriptions.get(key)!.add(ref);

    // Create channel if doesn't exist
    if (!this.channels.has(key)) {
      this.createChannel(config, key, userId);
    } else {
      // Increment subscription count
      const channelInfo = this.channels.get(key)!;
      channelInfo.subscriptionCount++;
    }

    // Return unsubscribe function
    return () => {
      const subs = this.subscriptions.get(key);
      if (subs) {
        subs.delete(ref);
        if (subs.size === 0) {
          this.subscriptions.delete(key);
          this.removeChannel(key);
        }
      }
    };
  }

  /** Create a new channel for a subscription config */
  private createChannel(config: TableSubscription, key: string, userId: string): void {
    const channelName = `rtm-${config.table}-${userId}-${Date.now()}`;
    
    const channel = supabase.channel(channelName);
    const schema = config.schema || 'public';
    const table = config.table;
    const filter = config.filter;
    
    // Determine event type - using switch for literal types
    const subscribeWithEvent = () => {
      switch (config.event) {
        case 'INSERT':
          return channel.on(
            'postgres_changes',
            { event: 'INSERT', schema, table, filter },
            (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
              this.handlePayload(key, payload);
            }
          );
        case 'UPDATE':
          return channel.on(
            'postgres_changes',
            { event: 'UPDATE', schema, table, filter },
            (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
              this.handlePayload(key, payload);
            }
          );
        case 'DELETE':
          return channel.on(
            'postgres_changes',
            { event: 'DELETE', schema, table, filter },
            (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
              this.handlePayload(key, payload);
            }
          );
        default:
          return channel.on(
            'postgres_changes',
            { event: '*', schema, table, filter },
            (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
              this.handlePayload(key, payload);
            }
          );
      }
    };

    subscribeWithEvent().subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.debug(`[RealtimeManager] Channel subscribed: ${config.table}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`[RealtimeManager] Channel error: ${config.table}`);
      }
    });

    this.channels.set(key, { channel, subscriptionCount: 1 });
  }

  /** Handle incoming payload and dispatch to callbacks */
  private handlePayload(
    key: string, 
    payload: RealtimePostgresChangesPayload<Record<string, unknown>>
  ): void {
    const subs = this.subscriptions.get(key);
    if (subs) {
      subs.forEach((sub) => {
        try {
          sub.callback(payload);
        } catch (error: unknown) {
          console.error('[RealtimeManager] Callback error:', error);
        }
      });
    }
  }

  /** Remove a channel */
  private removeChannel(key: string): void {
    const channelInfo = this.channels.get(key);
    if (channelInfo) {
      channelInfo.subscriptionCount--;
      if (channelInfo.subscriptionCount <= 0) {
        supabase.removeChannel(channelInfo.channel);
        this.channels.delete(key);
      }
    }
  }

  /** Cleanup all channels */
  async cleanup(): Promise<void> {
    for (const [key, channelInfo] of this.channels.entries()) {
      await supabase.removeChannel(channelInfo.channel);
      this.channels.delete(key);
    }
    this.subscriptions.clear();
  }

  /** Get current subscription count for debugging */
  getSubscriptionCount(): number {
    let count = 0;
    this.subscriptions.forEach((subs) => {
      count += subs.size;
    });
    return count;
  }

  /** Get current channel count for debugging */
  getChannelCount(): number {
    return this.channels.size;
  }

  /** Check if manager has active channels */
  isActive(): boolean {
    return this.channels.size > 0;
  }
}

// Export singleton instance getter
export const RealtimeManager = RealtimeManagerClass.getInstance();

// Export class for testing
export { RealtimeManagerClass };
