/**
 * useConnectedAccounts Hook
 * 
 * Hook for managing connected OAuth accounts (calendars) for locations.
 * Provides CRUD operations and real-time updates.
 * 
 * @module hooks/useConnectedAccounts
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';
import { getErrorMessage } from '@/types/errors';

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
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    if (!agentId) return;

    try {
      setLoading(true);
      let query = supabase
        .from('connected_accounts')
        .select('id, location_id, agent_id, user_id, provider, account_email, calendar_id, calendar_name, is_active, last_synced_at, sync_error, created_at, updated_at')
        .eq('agent_id', agentId);

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;
      setAccounts((data || []) as ConnectedAccount[]);
    } catch (error) {
      logger.error('Error fetching connected accounts', error);
    } finally {
      setLoading(false);
    }
  }, [locationId, agentId]);

  // Initial fetch and real-time subscription
  useEffect(() => {
    if (!agentId) return;

    fetchAccounts();

    // Subscribe to real-time updates
    const filter = locationId
      ? `agent_id=eq.${agentId},location_id=eq.${locationId}`
      : `agent_id=eq.${agentId}`;

    const channel = supabase
      .channel(`connected-accounts-${agentId}-${locationId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connected_accounts',
          filter,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAccounts((prev) => {
              if (prev.some((a) => a.id === (payload.new as ConnectedAccount).id)) {
                return prev;
              }
              return [...prev, payload.new as ConnectedAccount];
            });
          } else if (payload.eventType === 'UPDATE') {
            setAccounts((prev) =>
              prev.map((a) =>
                a.id === (payload.new as ConnectedAccount).id
                  ? (payload.new as ConnectedAccount)
                  : a
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setAccounts((prev) =>
              prev.filter((a) => a.id !== (payload.old as { id: string }).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId, locationId, fetchAccounts]);

  /**
   * Disconnect an account (revoke and delete)
   */
  const disconnectAccount = async (accountId: string): Promise<boolean> => {
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
      return true;
    } catch (error) {
      logger.error('Error disconnecting account', error);
      toast.error('Failed to disconnect calendar', {
        description: getErrorMessage(error),
      });
      return false;
    }
  };

  /**
   * Refresh OAuth tokens for an account
   */
  const refreshTokens = async (accountId: string): Promise<boolean> => {
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
      return true;
    } catch (error) {
      logger.error('Error refreshing tokens', error);
      return false;
    }
  };

  return {
    accounts,
    loading,
    disconnectAccount,
    refreshTokens,
    refetch: fetchAccounts,
  };
};
