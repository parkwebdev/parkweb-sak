/**
 * @fileoverview Team settings page with member management.
 * Handles member invitations, role editing, and profile management.
 * Respects manage_team permission for invite functionality.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { RoleManagementDialog } from './RoleManagementDialog';
import { ProfileEditDialog } from '@/components/team/ProfileEditDialog';
import { TeamMembersTable } from '@/components/team/TeamMembersTable';
import { InviteMemberDialog } from '@/components/team/InviteMemberDialog';
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog';
import { useTeam } from '@/hooks/useTeam';
import { useRoleAuthorization } from '@/hooks/useRoleAuthorization';
import { useCanManage } from '@/hooks/useCanManage';
import { TeamMember, UserRole } from '@/types/team';
import { SkeletonTableSection } from '@/components/ui/skeleton';

interface TeamSettingsProps {
  openMemberId?: string | null;
}

export function TeamSettings({ openMemberId }: TeamSettingsProps) {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const { role: currentUserRole, hasPermission, isAdmin } = useRoleAuthorization();
  const { 
    teamMembers, 
    loading, 
    canManageRoles, 
    inviteMember, 
    removeMember, 
    updateMemberRole,
    fetchTeamMembers
  } = useTeam();

  const canManageTeam = useCanManage('manage_team');

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

  const handleRemoveMember = (member: TeamMember) => {
    setMemberToDelete(member);
    setDeleteConfirmText('');
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    
    setIsDeleting(true);
    const success = await removeMember(memberToDelete);
    setIsDeleting(false);
    
    if (success) {
      setIsDeleteDialogOpen(false);
      setMemberToDelete(null);
      setDeleteConfirmText('');
    }
  };

  const handleInviteMember = async (data: { firstName: string; lastName: string; email: string }): Promise<boolean> => {
    return await inviteMember(data);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {canManageTeam && (
          <div className="flex justify-end mb-6">
            <InviteMemberDialog onInvite={handleInviteMember} />
          </div>
        )}
        <SkeletonTableSection rows={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {canManageTeam && (
        <div className="flex justify-end mb-6">
          <InviteMemberDialog onInvite={handleInviteMember} />
        </div>
      )}

      {/* Team Members Table */}
      <TeamMembersTable
        teamMembers={teamMembers}
        currentUserId={user?.id}
        currentUserRole={currentUserRole}
        canManageRoles={canManageRoles}
        onEditRole={handleEditRole}
        onEditProfile={isAdmin ? handleEditProfile : undefined}
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
          await updateMemberRole(member, role as UserRole, permissions);
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

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setMemberToDelete(null);
            setDeleteConfirmText('');
          }
        }}
        title="Remove Team Member"
        description={`This will permanently remove ${memberToDelete?.display_name || memberToDelete?.email || 'this member'} from your team. They will lose access to all team resources.`}
        confirmationText="delete"
        confirmationValue={deleteConfirmText}
        onConfirmationValueChange={setDeleteConfirmText}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};