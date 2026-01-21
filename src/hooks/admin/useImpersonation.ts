/**
 * Hook for managing impersonation sessions
 * 
 * Security features:
 * - 30 minute session expiry (auto-end)
 * - Reason required for each session
 * - Full audit logging
 * - Visual indicator when impersonating
 * - One-click exit
 * - Admin protection (cannot impersonate super_admins)
 * - Rate limiting (max 5 per hour, enforced server-side)
 * 
 * @module hooks/admin/useImpersonation
 */

import { useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminQueryKeys } from '@/lib/admin/admin-query-keys';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getErrorMessage } from '@/types/errors';
import type { ImpersonationState } from '@/types/admin';

/** Session duration in milliseconds (30 minutes) */
const SESSION_DURATION_MS = 30 * 60 * 1000;

/** Check interval for session expiry (every minute) */
const EXPIRY_CHECK_INTERVAL_MS = 60 * 1000;

interface UseImpersonationResult {
  isImpersonating: boolean;
  targetUserId: string | null;
  targetUserEmail: string | null;
  targetUserName: string | null;
  sessionId: string | null;
  startedAt: string | null;
  expiresAt: string | null;
  remainingMinutes: number | null;
  loading: boolean;
  startImpersonation: (targetUserId: string, reason: string) => Promise<void>;
  endImpersonation: () => Promise<void>;
  endAllSessions: () => Promise<void>;
  isStarting: boolean;
  isEnding: boolean;
  isEndingAll: boolean;
}

export function useImpersonation(): UseImpersonationResult {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: adminQueryKeys.impersonation.current(),
    queryFn: async (): Promise<ImpersonationState & { expiresAt: string | null }> => {
      if (!user) {
        return {
          isImpersonating: false,
          targetUserId: null,
          targetUserEmail: null,
          targetUserName: null,
          sessionId: null,
          startedAt: null,
          expiresAt: null,
        };
      }

      // Check for active impersonation session
      const { data: session } = await supabase
        .from('impersonation_sessions')
        .select('*')
        .eq('admin_user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!session) {
        return {
          isImpersonating: false,
          targetUserId: null,
          targetUserEmail: null,
          targetUserName: null,
          sessionId: null,
          startedAt: null,
          expiresAt: null,
        };
      }

      // Calculate expiry time
      const startedAt = session.started_at || new Date().toISOString();
      const expiresAt = new Date(new Date(startedAt).getTime() + SESSION_DURATION_MS).toISOString();

      // Check if session has expired
      if (new Date() > new Date(expiresAt)) {
        // Auto-end expired session
        await supabase
          .from('impersonation_sessions')
          .update({
            is_active: false,
            ended_at: new Date().toISOString(),
          })
          .eq('id', session.id);

        // Log the auto-end
        await supabase.from('admin_audit_log').insert({
          admin_user_id: user.id,
          action: 'impersonation_auto_expired',
          target_type: 'session',
          target_id: session.id,
          details: { 
            target_user_id: session.target_user_id,
            reason: 'Session expired after 30 minutes' 
          },
        });

        toast.info('Impersonation session expired', {
          description: 'Your session has been automatically ended after 30 minutes.',
        });

        return {
          isImpersonating: false,
          targetUserId: null,
          targetUserEmail: null,
          targetUserName: null,
          sessionId: null,
          startedAt: null,
          expiresAt: null,
        };
      }

      // Get target user details
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, display_name')
        .eq('user_id', session.target_user_id)
        .maybeSingle();

      return {
        isImpersonating: true,
        targetUserId: session.target_user_id,
        targetUserEmail: profile?.email || null,
        targetUserName: profile?.display_name || null,
        sessionId: session.id,
        startedAt,
        expiresAt,
      };
    },
    enabled: !!user,
    staleTime: 30000,
    refetchInterval: EXPIRY_CHECK_INTERVAL_MS, // Check for expiry every minute
  });

  // Calculate remaining minutes
  const getRemainingMinutes = useCallback((): number | null => {
    if (!data?.expiresAt) return null;
    const now = new Date().getTime();
    const expires = new Date(data.expiresAt).getTime();
    const remaining = Math.max(0, Math.floor((expires - now) / 60000));
    return remaining;
  }, [data?.expiresAt]);

  // Show warning when 5 minutes or less remaining
  useEffect(() => {
    if (!data?.isImpersonating || !data.expiresAt) return;

    const checkExpiry = () => {
      const remaining = getRemainingMinutes();
      if (remaining !== null && remaining <= 5 && remaining > 0) {
        toast.warning(`Impersonation session expires in ${remaining} minute${remaining !== 1 ? 's' : ''}`, {
          id: 'impersonation-expiry-warning',
        });
      }
    };

    const interval = setInterval(checkExpiry, 60000);
    return () => clearInterval(interval);
  }, [data?.isImpersonating, data?.expiresAt, getRemainingMinutes]);

  const startMutation = useMutation({
    mutationFn: async ({ targetUserId, reason }: { targetUserId: string; reason: string }) => {
      if (!user) throw new Error('Not authenticated');

      // Validate reason length (minimum 10 characters as per edge function)
      if (reason.trim().length < 10) {
        throw new Error('Reason must be at least 10 characters');
      }

      // Create impersonation session
      const { error } = await supabase.from('impersonation_sessions').insert({
        admin_user_id: user.id,
        target_user_id: targetUserId,
        reason: reason.trim(),
        is_active: true,
      });

      if (error) throw error;

      // Log the action
      await supabase.from('admin_audit_log').insert({
        admin_user_id: user.id,
        action: 'impersonation_start',
        target_type: 'account',
        target_id: targetUserId,
        details: { reason: reason.trim() },
      });
    },
    onSuccess: () => {
      // Invalidate ALL queries to refetch with new impersonated context
      // This ensures all data-scoped queries use the target user's ID
      queryClient.invalidateQueries();
      toast.success('Impersonation started', {
        description: 'You are now viewing this user\'s data. Session expires in 30 minutes.',
      });
    },
    onError: (error: unknown) => {
      toast.error('Failed to start impersonation', { description: getErrorMessage(error) });
    },
  });

  const endMutation = useMutation({
    mutationFn: async () => {
      if (!user || !data?.sessionId) throw new Error('No active session');

      const { error } = await supabase
        .from('impersonation_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
        })
        .eq('id', data.sessionId);

      if (error) throw error;

      // Log the action
      await supabase.from('admin_audit_log').insert({
        admin_user_id: user.id,
        action: 'impersonation_end',
        target_type: 'account',
        target_id: data.targetUserId,
      });
    },
    onSuccess: () => {
      // Invalidate ALL queries to refetch with admin's own context
      queryClient.invalidateQueries();
      toast.success('Impersonation ended', {
        description: 'You are now viewing your own data.',
      });
    },
    onError: (error: unknown) => {
      toast.error('Failed to end impersonation', { description: getErrorMessage(error) });
    },
  });

  // End ALL active sessions for this admin (emergency/cleanup)
  const endAllSessionsMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('impersonation_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
        })
        .eq('admin_user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;

      // Log audit entry for bulk action
      await supabase.from('admin_audit_log').insert({
        admin_user_id: user.id,
        action: 'impersonation_end',
        target_type: 'system',
        details: { bulk_end: true },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success('All sessions ended', {
        description: 'All active impersonation sessions have been terminated',
      });
    },
    onError: (error: unknown) => {
      toast.error('Failed to end sessions', {
        description: getErrorMessage(error),
      });
    },
  });

  return {
    isImpersonating: data?.isImpersonating || false,
    targetUserId: data?.targetUserId || null,
    targetUserEmail: data?.targetUserEmail || null,
    targetUserName: data?.targetUserName || null,
    sessionId: data?.sessionId || null,
    startedAt: data?.startedAt || null,
    expiresAt: data?.expiresAt || null,
    remainingMinutes: getRemainingMinutes(),
    loading: isLoading,
    startImpersonation: (targetUserId, reason) =>
      startMutation.mutateAsync({ targetUserId, reason }),
    endImpersonation: endMutation.mutateAsync,
    endAllSessions: endAllSessionsMutation.mutateAsync,
    isStarting: startMutation.isPending,
    isEnding: endMutation.isPending,
    isEndingAll: endAllSessionsMutation.isPending,
  };
}

/**
 * Lightweight selector hook for impersonation target ID.
 * Used by useAccountOwnerId to include in query key without circular dependencies.
 * This hook only returns the targetUserId and doesn't depend on useAccountOwnerId.
 */
export function useImpersonationTarget(): string | null {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: adminQueryKeys.impersonation.current(),
    queryFn: async (): Promise<string | null> => {
      if (!user) return null;

      const { data: session } = await supabase
        .from('impersonation_sessions')
        .select('target_user_id, started_at')
        .eq('admin_user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!session) return null;

      // Check if session has expired (30 minutes)
      const startedAt = session.started_at || new Date().toISOString();
      const expiresAt = new Date(new Date(startedAt).getTime() + 30 * 60 * 1000);
      
      if (new Date() > expiresAt) return null;

      return session.target_user_id;
    },
    enabled: !!user,
    staleTime: 30000,
  });

  return data ?? null;
}
