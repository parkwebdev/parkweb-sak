/**
 * Hook for managing impersonation sessions
 * 
 * @module hooks/admin/useImpersonation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminQueryKeys } from '@/lib/admin/admin-query-keys';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getErrorMessage } from '@/types/errors';
import type { ImpersonationState } from '@/types/admin';

interface UseImpersonationResult {
  isImpersonating: boolean;
  targetUserId: string | null;
  targetUserEmail: string | null;
  targetUserName: string | null;
  sessionId: string | null;
  loading: boolean;
  startImpersonation: (targetUserId: string, reason: string) => Promise<void>;
  endImpersonation: () => Promise<void>;
  isStarting: boolean;
  isEnding: boolean;
}

export function useImpersonation(): UseImpersonationResult {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: adminQueryKeys.impersonation.current(),
    queryFn: async (): Promise<ImpersonationState> => {
      if (!user) {
        return {
          isImpersonating: false,
          targetUserId: null,
          targetUserEmail: null,
          targetUserName: null,
          sessionId: null,
          startedAt: null,
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
        startedAt: session.started_at,
      };
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const startMutation = useMutation({
    mutationFn: async ({ targetUserId, reason }: { targetUserId: string; reason: string }) => {
      if (!user) throw new Error('Not authenticated');

      // Create impersonation session
      const { error } = await supabase.from('impersonation_sessions').insert({
        admin_user_id: user.id,
        target_user_id: targetUserId,
        reason,
        is_active: true,
      });

      if (error) throw error;

      // Log the action
      await supabase.from('admin_audit_log').insert({
        admin_user_id: user.id,
        action: 'impersonation_start',
        target_type: 'account',
        target_id: targetUserId,
        details: { reason },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.impersonation.all() });
      toast.success('Impersonation started');
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
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.impersonation.all() });
      toast.success('Impersonation ended');
    },
    onError: (error: unknown) => {
      toast.error('Failed to end impersonation', { description: getErrorMessage(error) });
    },
  });

  return {
    isImpersonating: data?.isImpersonating || false,
    targetUserId: data?.targetUserId || null,
    targetUserEmail: data?.targetUserEmail || null,
    targetUserName: data?.targetUserName || null,
    sessionId: data?.sessionId || null,
    loading: isLoading,
    startImpersonation: (targetUserId, reason) =>
      startMutation.mutateAsync({ targetUserId, reason }),
    endImpersonation: endMutation.mutateAsync,
    isStarting: startMutation.isPending,
    isEnding: endMutation.isPending,
  };
}
