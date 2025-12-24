/**
 * useConnectedAccounts Hook
 * 
 * Hook for managing connected OAuth accounts (calendars) for locations.
 * Uses React Query for caching and real-time updates.
 * 
 * @module hooks/useConnectedAccounts
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';
import { getErrorMessage } from '@/types/errors';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { queryKeys } from '@/lib/query-keys';

export interface ConnectedAccount {
  id: string;
  location_id: string | null;
  agent_id: string;
  user_id: string;
  provider: 'google_calendar' | 'outlook_calendar';
  account_email: string;
  calendar_id: string | null;
  calendar_name: string | null;
  is_active: boolean;
  last_synced_at: string | null;
  sync_error: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Hook for managing connected calendar accounts.
 * 
 * @param locationId - Optional location ID to scope accounts
 * @param agentId - Agent ID to scope accounts
 * @returns Connected accounts management methods and state
 */
export const useConnectedAccounts = (locationId?: string, agentId?: string) => {
  const queryClient = useQueryClient();

  // Build realtime filter
  const realtimeFilter = agentId
    ? locationId
      ? `agent_id=eq.${agentId},location_id=eq.${locationId}`
      : `agent_id=eq.${agentId}`
    : undefined;

  // Fetch accounts with React Query
  const { data: accounts = [], isLoading: loading, refetch } = useSupabaseQuery<ConnectedAccount[]>({
    queryKey: queryKeys.connectedAccounts.list(agentId || '', locationId),
    queryFn: async () => {
      if (!agentId) return [];

      let query = supabase
        .from('connected_accounts')
        .select('id, location_id, agent_id, user_id, provider, account_email, calendar_id, calendar_name, is_active, last_synced_at, sync_error, created_at, updated_at')
        .eq('agent_id', agentId);

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as ConnectedAccount[];
    },
    realtime: realtimeFilter ? {
      table: 'connected_accounts',
      filter: realtimeFilter,
    } : undefined,
    enabled: !!agentId,
    staleTime: 60000, // 1 minute
  });

  const invalidateAccounts = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.connectedAccounts.all });
  }, [queryClient]);

  /**
   * Disconnect an account (revoke and delete)
   */
  const disconnectAccount = useCallback(async (accountId: string): Promise<boolean> => {
    try {
      const account = accounts.find((a) => a.id === accountId);
      if (!account) return false;

      // Call edge function to revoke OAuth tokens
      const functionName = account.provider === 'google_calendar'
        ? 'google-calendar-auth'
        : 'outlook-calendar-auth';

      await supabase.functions.invoke(functionName, {
        body: {
          action: 'disconnect',
          accountId,
        },
      });

      // Delete from database
      const { error } = await supabase
        .from('connected_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      toast.success('Calendar disconnected');
      await invalidateAccounts();
      return true;
    } catch (error) {
      logger.error('Error disconnecting account', error);
      toast.error('Failed to disconnect calendar', {
        description: getErrorMessage(error),
      });
      return false;
    }
  }, [accounts, invalidateAccounts]);

  /**
   * Refresh OAuth tokens for an account
   */
  const refreshTokens = useCallback(async (accountId: string): Promise<boolean> => {
    try {
      const account = accounts.find((a) => a.id === accountId);
      if (!account) return false;

      const functionName = account.provider === 'google_calendar'
        ? 'google-calendar-auth'
        : 'outlook-calendar-auth';

      const { error } = await supabase.functions.invoke(functionName, {
        body: {
          action: 'refresh',
          accountId,
        },
      });

      if (error) throw error;
      await invalidateAccounts();
      return true;
    } catch (error) {
      logger.error('Error refreshing tokens', error);
      return false;
    }
  }, [accounts, invalidateAccounts]);

  return {
    accounts,
    loading,
    disconnectAccount,
    refreshTokens,
    refetch,
  };
};
