import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleManagementDialog } from './RoleManagementDialog';
import { ProfileEditDialog } from '@/components/team/ProfileEditDialog';
import { TeamMemberCard } from '@/components/team/TeamMemberCard';
import { InviteMemberDialog } from '@/components/team/InviteMemberDialog';
import { SearchInput } from '@/components/SearchInput';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users01 as Users } from '@untitledui/icons';
import { useTeam } from '@/hooks/useTeam';
import { useRoleAuthorization } from '@/hooks/useRoleAuthorization';
import { TeamMember } from '@/types/team';

export const TeamSettings: React.FC = () => {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
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

  // Filter and search team members
  const filteredMembers = useMemo(() => {
    return teamMembers.filter(member => {
      const matchesSearch = !searchTerm || 
        member.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || member.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [teamMembers, searchTerm, roleFilter]);

  const roleOptions = useMemo(() => {
    const roles = ['all', ...new Set(teamMembers.map(member => member.role || 'member'))];
    return roles.map(role => ({
      value: role,
      label: role === 'all' ? 'All Roles' : 
             role === 'super_admin' ? 'Super Admin' :
             role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    }));
  }, [teamMembers]);

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
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="h-10 bg-muted rounded animate-pulse flex-1" />
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 border border-border rounded-xl bg-card shadow-sm">
              <div className="flex items-start space-x-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-3 w-48 bg-muted rounded animate-pulse mb-1" />
                  <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="h-6 w-16 bg-muted rounded animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                  <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search team members..."
            className="w-full"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            {roleOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <InviteMemberDialog onInvite={handleInviteMember} />
      </div>

      {/* Results Summary */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Users size={16} />
        <span>
          {filteredMembers.length} of {teamMembers.length} team member{teamMembers.length !== 1 ? 's' : ''}
          {searchTerm && ` matching "${searchTerm}"`}
          {roleFilter !== 'all' && ` with role "${roleOptions.find(r => r.value === roleFilter)?.label}"`}
        </span>
      </div>

      {/* Team Members Grid */}
      {filteredMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <TeamMemberCard
              key={member.id}
              member={member}
              currentUserId={user?.id}
              canManageRoles={canManageRoles}
              onEditRole={handleEditRole}
              onEditProfile={isSuperAdmin ? handleEditProfile : undefined}
              onRemove={handleRemoveMember}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {searchTerm || roleFilter !== 'all' ? 'No matching team members' : 'No team members found'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || roleFilter !== 'all' 
              ? 'Try adjusting your search criteria or filters.'
              : 'Start by inviting team members to collaborate.'
            }
          </p>
          {(!searchTerm && roleFilter === 'all') && (
            <InviteMemberDialog onInvite={handleInviteMember} />
          )}
        </div>
      )}

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