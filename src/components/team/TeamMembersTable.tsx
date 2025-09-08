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
import { DotsHorizontal as MoreHorizontal, Settings01 as Settings, Trash01 as Trash, X } from '@untitledui/icons';
import { TeamMember } from '@/types/team';

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
      <div className="w-full bg-card border border-border rounded-xl overflow-hidden">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                      <div>
                        <div className="h-4 w-32 bg-muted rounded animate-pulse mb-1" />
                        <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="h-6 w-20 bg-muted rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-3 w-64 bg-muted rounded animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (teamMembers.length === 0) {
    return (
      <div className="w-full bg-card border border-border rounded-xl p-8">
        <div className="text-center">
          <div className="text-muted-foreground mb-2">No team members found</div>
          <div className="text-sm text-muted-foreground">Invite team members to get started.</div>
        </div>
      </div>
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
              <TableHead>Permissions</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamMembers.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatar_url || ''} />
                      <AvatarFallback className="text-xs">
                        {getInitials(member.display_name, member.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <div className="font-medium text-sm truncate">
                        {member.display_name || 'No name provided'}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {member.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getBadgeVariant(member.role || 'member')}>
                    {formatRole(member.role || 'member')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-xs text-muted-foreground max-w-xs truncate">
                    {member.permissions && member.permissions.length > 0 
                      ? member.permissions.slice(0, 3).join(', ') + (member.permissions.length > 3 ? '...' : '')
                      : 'No permissions assigned'
                    }
                  </div>
                </TableCell>
                <TableCell>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};