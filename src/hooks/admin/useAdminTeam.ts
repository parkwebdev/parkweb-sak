/**
 * Hook for managing Pilot team (super admins and pilot support)
 * 
 * @module hooks/admin/useAdminTeam
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminQueryKeys } from '@/lib/admin/admin-query-keys';
import { toast } from 'sonner';
import { getErrorMessage } from '@/types/errors';
import { useAuth } from '@/hooks/useAuth';
import type { PilotTeamMember, InvitePilotMemberData, AdminPermission, PilotTeamRole } from '@/types/admin';

interface UseAdminTeamResult {
  team: PilotTeamMember[];
  loading: boolean;
  error: Error | null;
  inviteMember: (data: InvitePilotMemberData) => Promise<boolean>;
  removeMember: (userId: string) => Promise<void>;
  updateMemberPermissions: (userId: string, role: PilotTeamRole, permissions: AdminPermission[]) => Promise<void>;
  isInviting: boolean;
  isRemoving: boolean;
  isUpdating: boolean;
}

export function useAdminTeam(): UseAdminTeamResult {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: adminQueryKeys.team.list(),
    queryFn: async (): Promise<PilotTeamMember[]> => {
      // Get all super_admin and pilot_support users
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, admin_permissions, created_at')
        .in('role', ['super_admin', 'pilot_support']);

      if (rolesError) throw rolesError;
      if (!roles || roles.length === 0) return [];

      const userIds = roles.map((r) => r.user_id);

      // Batch fetch profiles AND audit logs in parallel (avoids N+1)
      const [profilesResult, auditLogsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id, display_name, email, avatar_url, last_login_at')
          .in('user_id', userIds),
        supabase
          .from('admin_audit_log')
          .select('admin_user_id')
          .in('admin_user_id', userIds),
      ]);

      if (profilesResult.error) throw profilesResult.error;

      // Count audit logs locally (group by admin_user_id)
      const auditCountMap = new Map<string, number>();
      (auditLogsResult.data || []).forEach((log) => {
        const current = auditCountMap.get(log.admin_user_id) || 0;
        auditCountMap.set(log.admin_user_id, current + 1);
      });

      // Create profile lookup map
      const profileMap = new Map(
        profilesResult.data?.map((p) => [p.user_id, p]) || []
      );

      // Map synchronously - no more N+1
      const teamMembers: PilotTeamMember[] = roles.map((role) => {
        const profile = profileMap.get(role.user_id);
        return {
          id: role.user_id,
          user_id: role.user_id,
          email: profile?.email || '',
          display_name: profile?.display_name ?? null,
          avatar_url: profile?.avatar_url ?? null,
          role: role.role as PilotTeamMember['role'],
          admin_permissions: (role.admin_permissions || []) as AdminPermission[],
          created_at: role.created_at,
          last_login_at: profile?.last_login_at ?? null,
          audit_action_count: auditCountMap.get(role.user_id) || 0,
        };
      });

      return teamMembers;
    },
    staleTime: 60000,
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: InvitePilotMemberData): Promise<boolean> => {
      if (!user) throw new Error('You must be logged in to invite team members');

      // Get current super admin's name for the invite
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .single();

      const { error } = await supabase.functions.invoke('send-pilot-team-invitation', {
        body: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          role: data.role,
          invitedBy: profile?.display_name || 'Pilot Admin',
          adminPermissions: data.adminPermissions,
        }
      });

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.team.all() });
      toast.success('Pilot team invitation sent');
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
        .in('role', ['super_admin', 'pilot_support']);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.team.all() });
      toast.success('Team member removed from Pilot team');
    },
    onError: (error: unknown) => {
      toast.error('Failed to remove team member', { description: getErrorMessage(error) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ 
      userId, 
      role, 
      permissions 
    }: { 
      userId: string; 
      role: PilotTeamRole; 
      permissions: AdminPermission[] 
    }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ 
          role, 
          admin_permissions: role === 'super_admin' ? [] : permissions,
        })
        .eq('user_id', userId)
        .in('role', ['super_admin', 'pilot_support']);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.team.all() });
      toast.success('Permissions updated');
    },
    onError: (error: unknown) => {
      toast.error('Failed to update permissions', { description: getErrorMessage(error) });
    },
  });

  const inviteMember = async (data: InvitePilotMemberData): Promise<boolean> => {
    try {
      await inviteMutation.mutateAsync(data);
      return true;
    } catch {
      return false;
    }
  };

  const updateMemberPermissions = async (
    userId: string, 
    role: PilotTeamRole, 
    permissions: AdminPermission[]
  ): Promise<void> => {
    await updateMutation.mutateAsync({ userId, role, permissions });
  };

  return {
    team: data || [],
    loading: isLoading,
    error: error as Error | null,
    inviteMember,
    removeMember: removeMutation.mutateAsync,
    updateMemberPermissions,
    isInviting: inviteMutation.isPending,
    isRemoving: removeMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
