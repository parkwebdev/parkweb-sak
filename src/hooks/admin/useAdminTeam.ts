/**
 * Hook for managing Pilot team (super admins)
 * 
 * @module hooks/admin/useAdminTeam
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminQueryKeys } from '@/lib/admin/admin-query-keys';
import { toast } from 'sonner';
import { getErrorMessage } from '@/types/errors';
import type { PilotTeamMember } from '@/types/admin';

interface UseAdminTeamResult {
  team: PilotTeamMember[];
  loading: boolean;
  error: Error | null;
  inviteMember: (email: string) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  isInviting: boolean;
  isRemoving: boolean;
}

export function useAdminTeam(): UseAdminTeamResult {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: adminQueryKeys.team.list(),
    queryFn: async (): Promise<PilotTeamMember[]> => {
      // Get all super_admin users
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at')
        .eq('role', 'super_admin');

      if (rolesError) throw rolesError;

      if (!roles || roles.length === 0) return [];

      // Get profile data for each team member
      const userIds = roles.map((r) => r.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, email, avatar_url')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Get audit action counts
      const teamMembers: PilotTeamMember[] = await Promise.all(
        roles.map(async (role) => {
          const profile = profiles?.find((p) => p.user_id === role.user_id);
          
          const { count } = await supabase
            .from('admin_audit_log')
            .select('id', { count: 'exact', head: true })
            .eq('admin_user_id', role.user_id);

          return {
            id: role.user_id,
            user_id: role.user_id,
            email: profile?.email || '',
            display_name: profile?.display_name ?? null,
            avatar_url: profile?.avatar_url ?? null,
            role: role.role,
            created_at: role.created_at,
            last_login_at: null,
            audit_action_count: count || 0,
          };
        })
      );

      return teamMembers;
    },
    staleTime: 60000,
  });

  const inviteMutation = useMutation({
    mutationFn: async (email: string) => {
      // TODO: Implement invite flow - create pending invitation or directly add role
      toast.info('Team invite functionality will be implemented in Phase 5');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.team.all() });
    },
    onError: (error: unknown) => {
      toast.error('Failed to invite team member', { description: getErrorMessage(error) });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: 'admin' }) // Downgrade to admin instead of deleting
        .eq('user_id', userId)
        .eq('role', 'super_admin');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.team.all() });
      toast.success('Team member removed from super admin role');
    },
    onError: (error: unknown) => {
      toast.error('Failed to remove team member', { description: getErrorMessage(error) });
    },
  });

  return {
    team: data || [],
    loading: isLoading,
    error: error as Error | null,
    inviteMember: inviteMutation.mutateAsync,
    removeMember: removeMutation.mutateAsync,
    isInviting: inviteMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}
