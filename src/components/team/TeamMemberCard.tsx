/**
 * @fileoverview Team member card for grid view display.
 * Shows avatar, name, email, role badge, and management actions.
 */

import React from 'react';
import { Settings01 as Settings, Edit01 as Edit, Shield01 as Shield, X } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TeamMember } from '@/types/team';
import { formatJoinDate, getRoleColor } from '@/utils/validation';

interface TeamMemberCardProps {
  member: TeamMember;
  currentUserId?: string;
  canManageRoles: boolean;
  onEditRole: (member: TeamMember) => void;
  onEditProfile?: (member: TeamMember) => void;
  onRemove: (member: TeamMember) => void;
}

export const TeamMemberCard: React.FC<TeamMemberCardProps> = ({
  member,
  currentUserId,
  canManageRoles,
  onEditRole,
  onEditProfile,
  onRemove,
}) => {
  const isCurrentUser = member.user_id === currentUserId;
  const showManagementButtons = (canManageRoles && !isCurrentUser) || isCurrentUser;

  return (
    <div className="p-4 sm:p-6 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col space-y-4">
        {/* Header section with avatar and basic info */}
        <div className="flex items-start space-x-3">
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
            <AvatarImage src={member.avatar_url || undefined} />
            <AvatarFallback className="text-xs sm:text-sm font-medium">
              {member.display_name 
                ? member.display_name.split(' ').map(n => n[0]).join('').toUpperCase()
                : member.email?.substring(0, 2).toUpperCase() || 'U'
              }
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground mb-1 truncate">
              {member.display_name || member.email?.split('@')[0] || 'Unknown User'}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-2 truncate">{member.email}</p>
            <p className="text-xs text-muted-foreground">
              Joined {formatJoinDate(member.created_at)}
            </p>
          </div>
        </div>
        
        {/* Role badge and actions section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div 
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold self-start ${getRoleColor(member.role || 'member')}`}
          >
            {isCurrentUser 
              ? (
                  member.role === 'super_admin' ? 'Super Admin (You)' :
                  member.role === 'admin' ? 'Admin (You)' : 
                  `${(member.role || 'member').split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} (You)`
                )
              : (
                  member.role === 'super_admin' ? 'Super Admin' :
                  (member.role || 'member').split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                )
            }
          </div>
          
          {showManagementButtons && (
            <div className="flex items-center gap-2 flex-wrap">
              {/* Only show role management for non-super-admin users */}
              {!isCurrentUser && (
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => onEditRole(member)}
                  className="h-7 px-2 text-xs flex-shrink-0"
                  title="Manage Roles & Permissions"
                >
                  <Shield size={12} className="mr-1" />
                  <span className="hidden xs:inline">Roles</span>
                </Button>
              )}
              {onEditProfile && !isCurrentUser && (
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => onEditProfile(member)}
                  className="h-7 px-2 text-xs flex-shrink-0"
                  title="Edit Profile"
                >
                  <Edit size={12} className="mr-1" />
                  <span className="hidden xs:inline">Edit</span>
                </Button>
              )}
              {/* Only show remove for admins managing others, not for self-management */}
              {canManageRoles && !isCurrentUser && (
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => onRemove(member)}
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 dark:text-red-400 dark:hover:text-red-300 border-destructive/20 hover:border-destructive/40 flex-shrink-0"
                  title="Remove Member"
                >
                  <X size={12} />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};