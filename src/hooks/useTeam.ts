import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';
import { TeamMember, InviteMemberData, UserRole, AppPermission } from '@/types/team';
import { logger } from '@/utils/logger';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { queryKeys } from '@/lib/query-keys';
import type { TeamProfile } from '@/types/report';

/**
 * Hook for managing team members and roles.
 * Uses React Query for caching and real-time updates.
 * 
 * @returns {Object} Team management methods and state
 * @returns {TeamMember[]} teamMembers - List of team members with profiles and roles
 * @returns {boolean} loading - Loading state
 * @returns {UserRole} currentUserRole - Current user's role
 * @returns {boolean} canManageRoles - Whether current user can manage roles
 * @returns {Function} refetch - Refresh team members list
 * @returns {Function} inviteMember - Send team invitation email
 * @returns {Function} removeMember - Remove a team member
 * @returns {Function} updateMemberRole - Update a member's role and permissions
 */
export const useTeam = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch current user's role
  const { data: currentUserRole = 'member' as UserRole } = useSupabaseQuery<UserRole>({
    queryKey: [...queryKeys.team.all, 'current-role', user?.id],
    queryFn: async () => {
      if (!user) return 'member' as UserRole;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error fetching user role', error);
        return 'member' as UserRole;
      }

      return (data?.role as UserRole) || 'member';
    },
    realtime: {
      table: 'user_roles',
      filter: user ? `user_id=eq.${user.id}` : undefined,
    },
    enabled: !!user,
  });

  // Fetch team members with profiles and roles
  const { data: teamMembers = [], isLoading: loading, refetch } = useSupabaseQuery<TeamMember[]>({
    queryKey: queryKeys.team.list(user?.id),
    queryFn: async () => {
      if (!user) return [];

      // Use secure function that doesn't expose emails to non-owners
      const { data: profilesData, error: profilesError } = await supabase
        .rpc('get_team_profiles', { p_owner_id: user.id });

      if (profilesError) {
        // Fallback to direct query if user is viewing their own profile only
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id);
          
        if (fallbackError) {
          toast.error("Error", {
            description: "Failed to load team members.",
          });
          return [];
        }
        
        // For single user, include their own email
        return (fallbackData || []).map(profile => ({
          ...profile,
          role: currentUserRole,
          permissions: [] as string[],
        }));
      }

      // Fetch roles for all team members
      const profiles = (profilesData || []) as TeamProfile[];
      const userIds = profiles.map((p) => p.user_id);
      
      if (userIds.length === 0) return [];
      
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, permissions')
        .in('user_id', userIds);

      if (rolesError) {
        logger.error('Error fetching roles', rolesError);
      }

      // Combine profile and role data
      return profiles.map((profile) => {
        const roleData = rolesData?.find(r => r.user_id === profile.user_id);
        return {
          ...profile,
          email: profile.user_id === user.id ? user.email : null, // Only show own email
          role: roleData?.role || 'member',
          permissions: roleData?.permissions || [],
        };
      });
    },
    // NOTE: Realtime removed - profiles table has no filter for team membership
    // so it was subscribing to ALL profile changes globally. React Query cache is sufficient.
    enabled: !!user,
    staleTime: 30000, // 30 seconds
  });

  const canManageRoles = useMemo(() => 
    ['admin', 'super_admin'].includes(currentUserRole), 
    [currentUserRole]
  );

  const invalidateTeamQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.team.all });
  };

  const inviteMember = async (inviteData: InviteMemberData): Promise<boolean> => {
    try {
      // Fetch user's company name and display name from profile
      let companyName = 'our team';
      let inviterName = user?.email || 'Team Admin';
      
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('company_name, display_name')
          .eq('user_id', user.id)
          .single();
        
        if (profileData?.company_name) {
          companyName = profileData.company_name;
        }
        if (profileData?.display_name) {
          inviterName = profileData.display_name;
        }
      }

      const { error } = await supabase.functions.invoke('send-team-invitation', {
        body: {
          firstName: inviteData.firstName,
          lastName: inviteData.lastName,
          email: inviteData.email,
          invitedBy: inviterName,
          companyName
        }
      });

      if (error) {
        toast.error("Failed to send invitation", {
          description: "There was an error sending the invitation email.",
        });
        return false;
      }

      const inviteeName = inviteData.firstName + (inviteData.lastName ? ` ${inviteData.lastName}` : '');
      toast.success("Invitation sent", {
        description: `Team invitation sent to ${inviteeName} (${inviteData.email})`,
      });
      
      return true;
    } catch (error: unknown) {
      toast.error("Error", {
        description: "Failed to send invitation.",
      });
      return false;
    }
  };

  const removeMember = async (member: TeamMember): Promise<boolean> => {
    // Guard: Check permission before attempting removal
    if (!canManageRoles) {
      toast.error("Permission denied", {
        description: "You don't have permission to remove team members.",
      });
      return false;
    }

    try {
      // Remove from user_roles table
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', member.user_id);

      if (roleError) {
        logger.error('Error removing user role', roleError);
      }

      // Remove from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', member.user_id);

      if (profileError) {
        toast.error("Remove failed", {
          description: "Failed to remove team member.",
        });
        return false;
      }

      toast.success("Member removed", {
        description: `${member.display_name || member.email} has been removed from the team.`,
      });

      await invalidateTeamQueries();
      return true;
    } catch (error: unknown) {
      toast.error("Remove failed", {
        description: "An error occurred while removing the team member.",
      });
      return false;
    }
  };

  const updateMemberRole = async (member: TeamMember, role: UserRole, permissions: string[]): Promise<boolean> => {
    // Guard: Check permission before attempting update
    if (!canManageRoles) {
      toast.error("Permission denied", {
        description: "You don't have permission to update team member roles.",
      });
      return false;
    }

    try {
      logger.debug('Attempting to update role for user', {
        userId: member.user_id,
        currentRole: member.role,
        newRole: role,
        newPermissions: permissions,
      });

      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: member.user_id,
          role: role as 'admin' | 'manager' | 'member',
          permissions: permissions as AppPermission[],
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        logger.error('Database error updating role', error);
        toast.error("Update failed", {
          description: `Database error: ${error.message}`,
        });
        return false;
      }

      logger.success('Role update successful');
      await invalidateTeamQueries();
      return true;
    } catch (error: unknown) {
      logger.error('Unexpected error updating role', error);
      toast.error("Update failed", {
        description: "An unexpected error occurred while updating the role.",
      });
      return false;
    }
  };

  return {
    teamMembers,
    loading,
    currentUserRole,
    canManageRoles,
    fetchTeamMembers: refetch, // Backward compatibility
    inviteMember,
    removeMember,
    updateMemberRole,
  };
};
