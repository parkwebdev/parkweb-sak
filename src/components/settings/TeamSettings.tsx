import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleManagementDialog } from './RoleManagementDialog';
import { ProfileEditDialog } from '@/components/team/ProfileEditDialog';
import { TeamMembersTable } from '@/components/team/TeamMembersTable';
import { InviteMemberDialog } from '@/components/team/InviteMemberDialog';
import { Button } from '@/components/ui/button';
import { Users01 as Users } from '@untitledui/icons';
import { useTeam } from '@/hooks/useTeam';
import { useRoleAuthorization } from '@/hooks/useRoleAuthorization';
import { TeamMember } from '@/types/team';
import { Spinner } from '@/components/ui/spinner';

interface TeamSettingsProps {
  openMemberId?: string | null;
}

export const TeamSettings: React.FC<TeamSettingsProps> = ({ openMemberId }) => {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const { user } = useAuth();
  const { role: currentUserRole } = useRoleAuthorization();
  const { 
    teamMembers, 
    loading, 
    canManageRoles, 
    inviteMember, 
    removeMember, 
    updateMemberRole,
    fetchTeamMembers
  } = useTeam();

  const isSuperAdmin = currentUserRole === 'super_admin';

  // Handle auto-opening a team member from URL parameter
  useEffect(() => {
    if (openMemberId && teamMembers.length > 0) {
      const memberToOpen = teamMembers.find(m => m.user_id === openMemberId);
      if (memberToOpen) {
        setSelectedMember(memberToOpen);
        setIsProfileDialogOpen(true);
      }
    }
  }, [openMemberId, teamMembers]);


  const handleEditRole = (member: TeamMember) => {
    setSelectedMember(member);
    setIsRoleDialogOpen(true);
  };

  const handleEditProfile = (member: TeamMember) => {
    setSelectedMember(member);
    setIsProfileDialogOpen(true);
  };

  const handleRemoveMember = async (member: TeamMember) => {
    if (!confirm(`Are you sure you want to remove ${member.display_name || member.email} from the team?`)) {
      return;
    }
    await removeMember(member);
  };

  const handleInviteMember = async (email: string): Promise<boolean> => {
    return await inviteMember({ email });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end mb-6">
          <InviteMemberDialog onInvite={handleInviteMember} />
        </div>
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-6">
        <InviteMemberDialog onInvite={handleInviteMember} />
      </div>

      {/* Team Members Table */}
      <TeamMembersTable
        teamMembers={teamMembers}
        currentUserId={user?.id}
        canManageRoles={canManageRoles}
        onEditRole={handleEditRole}
        onEditProfile={isSuperAdmin ? handleEditProfile : undefined}
        onRemove={handleRemoveMember}
        loading={loading}
      />

      <RoleManagementDialog
        member={selectedMember}
        isOpen={isRoleDialogOpen}
        onClose={() => {
          setIsRoleDialogOpen(false);
          setSelectedMember(null);
        }}
        onUpdate={async (member: TeamMember, role: string, permissions: string[]) => {
          await updateMemberRole(member, role as any, permissions);
        }}
      />

      <ProfileEditDialog
        member={selectedMember}
        isOpen={isProfileDialogOpen}
        onClose={() => {
          setIsProfileDialogOpen(false);
          setSelectedMember(null);
        }}
        onUpdate={fetchTeamMembers}
      />
    </div>
  );
};