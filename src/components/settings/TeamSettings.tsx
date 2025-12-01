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
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';

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
        <AnimatedList className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" staggerDelay={0.05}>
          {[1, 2, 3].map((i) => (
            <AnimatedItem key={i}>
            <div className="p-4 sm:p-6 border border-border rounded-xl bg-card shadow-sm">
              <div className="flex flex-col space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-muted animate-pulse flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="h-4 w-32 bg-muted rounded animate-pulse mb-2" />
                    <div className="h-3 w-48 bg-muted rounded animate-pulse mb-1" />
                    <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="h-6 w-20 bg-muted rounded animate-pulse" />
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="h-7 w-16 bg-muted rounded animate-pulse" />
                    <div className="h-7 w-16 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
            </AnimatedItem>
          ))}
        </AnimatedList>
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