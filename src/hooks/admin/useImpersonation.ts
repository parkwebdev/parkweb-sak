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
 * - localStorage persistence for surviving hot-reloads
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

/** localStorage key for persisting impersonation state across reloads */
const IMPERSONATION_STORAGE_KEY = 'pilot_impersonation_session';

/** Shape of stored session data */
interface StoredSession {
  sessionId: string;
  targetUserId: string;
  targetUserEmail: string | null;
  targetUserName: string | null;
  startedAt: string;
  expiresAt: string;
}

/**
 * Retrieve stored session from localStorage, returning null if expired or invalid
 */
function getStoredSession(): StoredSession | null {
  try {
    const stored = localStorage.getItem(IMPERSONATION_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as StoredSession;
    // Check if expired
    if (new Date() > new Date(parsed.expiresAt)) {
      localStorage.removeItem(IMPERSONATION_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Store session in localStorage for persistence across reloads
 */
function storeSession(session: StoredSession): void {
  try {
    localStorage.setItem(IMPERSONATION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Silently fail if storage is unavailable
  }
}

/**
 * Clear stored session from localStorage
 */
function clearStoredSession(): void {
  try {
    localStorage.removeItem(IMPERSONATION_STORAGE_KEY);
  } catch {
    // Silently fail
  }
}

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

  // Get stored session for initialData (survives hot-reloads)
  const storedSession = getStoredSession();

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
        // No active session in DB - clear any stale localStorage
        clearStoredSession();
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
        // Clear localStorage for expired session
        clearStoredSession();

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

      // Store valid session in localStorage for persistence across reloads
      storeSession({
        sessionId: session.id,
        targetUserId: session.target_user_id,
        targetUserEmail: profile?.email || null,
        targetUserName: profile?.display_name || null,
        startedAt,
        expiresAt,
      });

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
    // Use stored session as initialData so banner renders immediately on reload
    initialData: storedSession ? {
      isImpersonating: true,
      sessionId: storedSession.sessionId,
      targetUserId: storedSession.targetUserId,
      targetUserEmail: storedSession.targetUserEmail,
      targetUserName: storedSession.targetUserName,
      startedAt: storedSession.startedAt,
      expiresAt: storedSession.expiresAt,
    } : undefined,
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

      // Fetch the created session to get its ID and started_at
      const { data: session } = await supabase
        .from('impersonation_sessions')
        .select('id, started_at')
        .eq('admin_user_id', user.id)
        .eq('is_active', true)
        .single();

      if (!session) throw new Error('Session not created');

      // Log the action
      await supabase.from('admin_audit_log').insert({
        admin_user_id: user.id,
        action: 'impersonation_start',
        target_type: 'account',
        target_id: targetUserId,
        details: { reason: reason.trim() },
      });

      // Return session data for use in onSuccess
      return { session, targetUserId };
    },
    onSuccess: ({ session, targetUserId }) => {
      // Store in localStorage FIRST - before invalidating queries
      // This ensures useImpersonationTarget has data immediately on navigation
      const startedAt = session.started_at || new Date().toISOString();
      const expiresAt = new Date(new Date(startedAt).getTime() + SESSION_DURATION_MS);
      storeSession({
        sessionId: session.id,
        targetUserId,
        targetUserEmail: null, // Will be populated on next query
        targetUserName: null,
        startedAt,
        expiresAt: expiresAt.toISOString(),
      });

      // NOW invalidate queries - localStorage already has the data
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
      // Clear localStorage on session end
      clearStoredSession();
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
      // Clear localStorage on bulk session end
      clearStoredSession();
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
    startImpersonation: async (targetUserId, reason) => {
      await startMutation.mutateAsync({ targetUserId, reason });
    },
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
 * Uses localStorage for immediate availability on page reload.
 */
export function useImpersonationTarget(): string | null {
  const { user } = useAuth();

  // Get stored session - this is the SOURCE OF TRUTH for immediate availability
  // This allows navigation to work correctly before queries refetch
  const storedSession = getStoredSession();

  const { data } = useQuery({
    // Use DEDICATED query key to avoid conflicts with full useImpersonation hook
    queryKey: adminQueryKeys.impersonation.targetId(),
    queryFn: async (): Promise<string | null> => {
      if (!user) return null;

      const { data: session } = await supabase
        .from('impersonation_sessions')
        .select('target_user_id, started_at')
        .eq('admin_user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!session) {
        clearStoredSession();
        return null;
      }

      // Check if session has expired (30 minutes)
      const startedAt = session.started_at || new Date().toISOString();
      const expiresAt = new Date(new Date(startedAt).getTime() + SESSION_DURATION_MS);
      
      if (new Date() > expiresAt) {
        clearStoredSession();
        return null;
      }

      return session.target_user_id;
    },
    // Use stored targetUserId as initialData for immediate availability
    initialData: storedSession?.targetUserId ?? undefined,
    enabled: !!user,
    staleTime: 30000,
  });

  // Return localStorage value first if available (immediate), fallback to query data
  // This ensures navigation works correctly during the query invalidation/refetch cycle
  return storedSession?.targetUserId ?? data ?? null;
}
