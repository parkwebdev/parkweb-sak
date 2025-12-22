/**
 * Supabase Query Hook
 * 
 * Combines React Query with Supabase real-time subscriptions.
 * Automatically invalidates cache when database changes occur.
 * 
 * @module hooks/useSupabaseQuery
 */

import { useEffect, useRef } from 'react';
import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
  type QueryKey,
} from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Configuration for real-time subscriptions
 */
interface RealtimeConfig {
  /** Table name to subscribe to */
  table: string;
  /** Schema name (defaults to 'public') */
  schema?: string;
  /** Filter for the subscription (e.g., `agent_id=eq.${agentId}`) */
  filter?: string;
}

/**
 * Options for useSupabaseQuery
 */
interface UseSupabaseQueryOptions<TData, TError = Error> 
  extends Omit<UseQueryOptions<TData, TError, TData, QueryKey>, 'queryKey' | 'queryFn'> {
  /** Query key for caching */
  queryKey: QueryKey;
  /** Query function that fetches data from Supabase */
  queryFn: () => Promise<TData>;
  /** Real-time configuration for auto-invalidation */
  realtime?: RealtimeConfig;
}

/**
 * Hook that combines React Query with Supabase real-time subscriptions.
 * 
 * When database changes occur, the cache is automatically invalidated
 * and the query refetches in the background.
 * 
 * @example
 * ```tsx
 * const { data: agent, isLoading } = useSupabaseQuery({
 *   queryKey: queryKeys.agent.detail(userId),
 *   queryFn: async () => {
 *     const { data } = await supabase
 *       .from('agents')
 *       .select('*')
 *       .eq('user_id', userId)
 *       .single();
 *     return data;
 *   },
 *   realtime: {
 *     table: 'agents',
 *     filter: `user_id=eq.${userId}`,
 *   },
 *   enabled: !!userId,
 * });
 * ```
 */
export function useSupabaseQuery<TData, TError = Error>({
  queryKey,
  queryFn,
  realtime,
  enabled = true,
  ...options
}: UseSupabaseQueryOptions<TData, TError>) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Set up real-time subscription for cache invalidation
  useEffect(() => {
    if (!realtime || !enabled) return;

    const { table, schema = 'public', filter } = realtime;

    // Create unique channel name
    const channelName = `supabase-query-${table}-${filter || 'all'}-${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema,
          table,
          filter,
        },
        () => {
          // Invalidate the query to trigger a refetch
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [realtime?.table, realtime?.filter, enabled, queryClient, JSON.stringify(queryKey)]);

  return useQuery({
    queryKey,
    queryFn,
    enabled,
    ...options,
  });
}

/**
 * Options for useSupabaseMutation
 */
interface UseSupabaseMutationOptions<TData, TError, TVariables, TContext>
  extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'> {
  /** Mutation function */
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** Query keys to invalidate on success */
  invalidateKeys?: QueryKey[];
}

/**
 * Hook for Supabase mutations with automatic cache invalidation.
 * 
 * @example
 * ```tsx
 * const updateAgent = useSupabaseMutation({
 *   mutationFn: async (updates) => {
 *     const { data } = await supabase
 *       .from('agents')
 *       .update(updates)
 *       .eq('id', agentId)
 *       .select()
 *       .single();
 *     return data;
 *   },
 *   invalidateKeys: [queryKeys.agent.all],
 * });
 * ```
 */
export function useSupabaseMutation<TData, TError = Error, TVariables = void, TContext = unknown>({
  mutationFn,
  invalidateKeys = [],
  onSuccess,
  ...options
}: UseSupabaseMutationOptions<TData, TError, TVariables, TContext>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: async (data, variables, context) => {
      // Invalidate specified query keys
      await Promise.all(
        invalidateKeys.map((key) => 
          queryClient.invalidateQueries({ queryKey: key })
        )
      );

      // Call original onSuccess if provided
      onSuccess?.(data, variables, context);
    },
    ...options,
  });
}
