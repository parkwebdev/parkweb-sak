import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TeamMember, InviteMemberData, UserRole } from '@/types/team';

export const useTeam = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('member');
  const { toast } = useToast();
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
        console.error('Error fetching user role:', error);
        return;
      }

      setCurrentUserRole((data?.role as UserRole) || 'member');
    } catch (error) {
      console.error('Error in fetchCurrentUserRole:', error);
    }
  };

  const fetchTeamMembers = async (): Promise<void> => {
    try {
      setLoading(true);
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        toast({
          title: "Error",
          description: "Failed to load team members.",
          variant: "destructive",
        });
        return;
      }

      // Fetch roles for all members
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, permissions');

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
      }

      // Combine profile and role data
      const membersWithRoles = (profilesData || []).map(profile => {
        const roleData = rolesData?.find(r => r.user_id === profile.user_id);
        return {
          ...profile,
          role: roleData?.role || 'member',
          permissions: roleData?.permissions || [],
        };
      });

      setTeamMembers(membersWithRoles);
    } catch (error) {
      console.error('Error in fetchTeamMembers:', error);
    } finally {
      setLoading(false);
    }
  };

  const inviteMember = async (inviteData: InviteMemberData): Promise<boolean> => {
    try {
      const { error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          to: inviteData.email,
          type: 'team_invitation',
          title: 'Team Invitation',
          message: `You've been invited to join our team! Click the link below to get started.`,
          data: {
            invited_by: user?.email || 'Team Admin',
          }
        }
      });

      if (error) {
        toast({
          title: "Failed to send invitation",
          description: "There was an error sending the invitation email.",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Invitation sent",
        description: `Team invitation sent to ${inviteData.email}`,
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invitation.",
        variant: "destructive",
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
        console.error('Error removing user role:', roleError);
      }

      // Remove from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', member.user_id);

      if (profileError) {
        toast({
          title: "Remove failed",
          description: "Failed to remove team member.",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Member removed",
        description: `${member.display_name || member.email} has been removed from the team.`,
      });

      // Refresh the team members list
      await fetchTeamMembers();
      return true;
    } catch (error) {
      toast({
        title: "Remove failed", 
        description: "An error occurred while removing the team member.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateMemberRole = async (member: TeamMember, role: UserRole, permissions: string[]): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: member.user_id,
          role: role as 'admin' | 'manager' | 'member',
          permissions: permissions as any,
        } as any);

      if (error) {
        toast({
          title: "Update failed",
          description: "Failed to update member role and permissions.",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Role updated",
        description: `${member.display_name || member.email}'s role has been updated.`,
      });

      await fetchTeamMembers();
      await fetchCurrentUserRole();
      return true;
    } catch (error) {
      console.error('Error updating role:', error);
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