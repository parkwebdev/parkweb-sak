import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { DotsHorizontal as MoreHorizontal, Settings01 as Settings, Trash01 as Trash, X, Users01 } from '@untitledui/icons';
import { EmptyState } from '@/components/ui/empty-state';
import { TeamMember } from '@/types/team';
import { AnimatedTableRow } from '@/components/ui/animated-table-row';
import { Spinner } from '@/components/ui/spinner';

interface TeamMembersTableProps {
  teamMembers: TeamMember[];
  currentUserId?: string;
  canManageRoles: boolean;
  onEditRole: (member: TeamMember) => void;
  onEditProfile?: (member: TeamMember) => void;
  onRemove: (member: TeamMember) => void;
  loading?: boolean;
}

export const TeamMembersTable: React.FC<TeamMembersTableProps> = ({
  teamMembers,
  currentUserId,
  canManageRoles,
  onEditRole,
  onEditProfile,
  onRemove,
  loading
}) => {
  const getBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'default' as const;
      case 'admin':
        return 'secondary' as const;
      case 'manager':
        return 'outline' as const;
      default:
        return 'outline' as const;
    }
  };

  const formatRole = (role: string) => {
    if (role === 'super_admin') return 'Super Admin';
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getInitials = (displayName: string | null, email: string | null) => {
    if (displayName) {
      return displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  if (loading) {
    return (
      <div className="w-full bg-card border border-border rounded-xl p-8 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (teamMembers.length === 0) {
    return (
      <EmptyState
        icon={<Users01 className="h-5 w-5 text-muted-foreground/50" />}
        title="No team members found"
        description="Invite team members to get started."
      />
    );
  }

  return (
    <div className="w-full bg-card border border-border rounded-xl overflow-hidden">
      <div className="w-full overflow-x-auto">
        <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {teamMembers.map((member, index) => (
              <AnimatedTableRow key={member.id} index={index}>
                <TableCell className="py-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={member.avatar_url || ''} />
                      <AvatarFallback className="text-xs">
                        {getInitials(member.display_name, member.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0 max-w-xs">
                      <div className="font-medium text-sm truncate">
                        {member.display_name || 'No name provided'}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {member.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <Badge variant={getBadgeVariant(member.role || 'member')} className="whitespace-nowrap">
                    {formatRole(member.role || 'member')}
                  </Badge>
                </TableCell>
                <TableCell className="py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canManageRoles && member.role !== 'super_admin' && (
                        <DropdownMenuItem onClick={() => onEditRole(member)}>
                          <Settings className="mr-2 h-4 w-4" />
                          Manage Role
                        </DropdownMenuItem>
                      )}
                      {onEditProfile && (
                        <DropdownMenuItem onClick={() => onEditProfile(member)}>
                          <Settings className="mr-2 h-4 w-4" />
                          Edit Profile
                        </DropdownMenuItem>
                      )}
                      {canManageRoles && member.user_id !== currentUserId && (
                        <DropdownMenuItem 
                          onClick={() => onRemove(member)}
                          className="text-destructive focus:text-destructive"
                        >
                          <X className="mr-2 h-4 w-4 border border-border rounded" />
                          Remove Member
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </AnimatedTableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};