import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleManagementDialog } from './RoleManagementDialog';
import { TeamMemberCard } from '@/components/team/TeamMemberCard';
import { InviteMemberDialog } from '@/components/team/InviteMemberDialog';
import { useTeam } from '@/hooks/useTeam';
import { TeamMember } from '@/types/team';

export const TeamSettings: React.FC = () => {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const { user } = useAuth();
  const { 
    teamMembers, 
    loading, 
    canManageRoles, 
    inviteMember, 
    removeMember, 
    updateMemberRole 
  } = useTeam();

  const handleEditRole = (member: TeamMember) => {
    setSelectedMember(member);
    setIsRoleDialogOpen(true);
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
      <div className="space-y-6 lg:space-y-8">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-border rounded-lg bg-background gap-4">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:space-x-4">
                <div className="h-6 w-16 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <InviteMemberDialog onInvite={handleInviteMember} />
      </div>

      <div className="space-y-3">
        {teamMembers.map((member) => (
          <TeamMemberCard
            key={member.id}
            member={member}
            currentUserId={user?.id}
            canManageRoles={canManageRoles}
            onEditRole={handleEditRole}
            onRemove={handleRemoveMember}
          />
        ))}
        
        {teamMembers.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No team members found.
          </div>
        )}
      </div>

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
    </div>
  );
};