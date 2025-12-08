import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';
import { TeamMember, InviteMemberData, UserRole } from '@/types/team';
import { logger } from '@/utils/logger';

/**
 * Hook for managing team members and roles.
 * Handles team invitations, role management, and member removal.
 * Uses secure RPC functions to prevent email exposure between team members.
 * 
 * @returns {Object} Team management methods and state
 * @returns {TeamMember[]} teamMembers - List of team members with profiles and roles
 * @returns {boolean} loading - Loading state
 * @returns {UserRole} currentUserRole - Current user's role
 * @returns {boolean} canManageRoles - Whether current user can manage roles
 * @returns {Function} fetchTeamMembers - Refresh team members list
 * @returns {Function} inviteMember - Send team invitation email
 * @returns {Function} removeMember - Remove a team member
 * @returns {Function} updateMemberRole - Update a member's role and permissions
 */
export const useTeam = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('member');
  const { user } = useAuth();

  const canManageRoles = ['admin', 'super_admin'].includes(currentUserRole);

  useEffect(() => {
    if (user) {
      fetchTeamMembers();
      fetchCurrentUserRole();
    }
  }, [user]);

  const fetchCurrentUserRole = async (): Promise<void> => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error fetching user role', error);
        return;
      }

      setCurrentUserRole((data?.role as UserRole) || 'member');
    } catch (error) {
      logger.error('Error in fetchCurrentUserRole', error);
    }
  };

  const fetchTeamMembers = async (): Promise<void> => {
    if (!user) return;
    
    try {
      setLoading(true);
      
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
          return;
        }
        
        // For single user, include their own email
        const membersWithRoles = (fallbackData || []).map(profile => ({
          ...profile,
          role: currentUserRole,
          permissions: [],
        }));
        setTeamMembers(membersWithRoles);
        return;
      }

      // Fetch roles for all team members
      const userIds = (profilesData || []).map((p: any) => p.user_id);
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, permissions')
        .in('user_id', userIds);

      if (rolesError) {
        logger.error('Error fetching roles', rolesError);
      }

      // Combine profile and role data
      const membersWithRoles = (profilesData || []).map((profile: any) => {
        const roleData = rolesData?.find(r => r.user_id === profile.user_id);
        return {
          ...profile,
          email: profile.user_id === user.id ? user.email : null, // Only show own email
          role: roleData?.role || 'member',
          permissions: roleData?.permissions || [],
        };
      });

      setTeamMembers(membersWithRoles);
    } catch (error) {
      logger.error('Error in fetchTeamMembers', error);
    } finally {
      setLoading(false);
    }
  };

  const inviteMember = async (inviteData: InviteMemberData): Promise<boolean> => {
    try {
      const { error } = await supabase.functions.invoke('send-team-invitation', {
        body: {
          email: inviteData.email,
          invitedBy: user?.email || 'Team Admin',
          companyName: 'our team'
        }
      });

      if (error) {
        toast.error("Failed to send invitation", {
          description: "There was an error sending the invitation email.",
        });
        return false;
      }

      toast.success("Invitation sent", {
        description: `Team invitation sent to ${inviteData.email}`,
      });
      
      return true;
    } catch (error) {
      toast.error("Error", {
        description: "Failed to send invitation.",
      });
      return false;
    }
  };

  const removeMember = async (member: TeamMember): Promise<boolean> => {
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

      // Refresh the team members list
      await fetchTeamMembers();
      return true;
    } catch (error) {
      toast.error("Remove failed", {
        description: "An error occurred while removing the team member.",
      });
      return false;
    }
  };

  const updateMemberRole = async (member: TeamMember, role: UserRole, permissions: string[]): Promise<boolean> => {
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
          permissions: permissions as any,
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

      await fetchTeamMembers();
      await fetchCurrentUserRole();
      return true;
    } catch (error) {
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
    fetchTeamMembers,
    inviteMember,
    removeMember,
    updateMemberRole,
  };
};
