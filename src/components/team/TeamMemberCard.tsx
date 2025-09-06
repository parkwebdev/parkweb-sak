import React from 'react';
import { Settings01 as Settings, X } from '@untitledui/icons';
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
  onRemove: (member: TeamMember) => void;
}

export const TeamMemberCard: React.FC<TeamMemberCardProps> = ({
  member,
  currentUserId,
  canManageRoles,
  onEditRole,
  onRemove,
}) => {
  const isCurrentUser = member.user_id === currentUserId;
  const showManagementButtons = (canManageRoles && !isCurrentUser) || isCurrentUser;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-border rounded-lg bg-background gap-4">
      <div className="flex items-center space-x-4">
        <Avatar>
          <AvatarImage src={member.avatar_url || undefined} />
          <AvatarFallback>
            {member.display_name 
              ? member.display_name.split(' ').map(n => n[0]).join('').toUpperCase()
              : member.email?.substring(0, 2).toUpperCase() || 'U'
            }
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-sm font-medium text-foreground">
            {member.display_name || member.email?.split('@')[0] || 'Unknown User'}
          </h3>
          <p className="text-xs text-muted-foreground">{member.email}</p>
          <p className="text-xs text-muted-foreground">
            Joined {formatJoinDate(member.created_at)}
          </p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:space-x-4">
        <Badge className={`text-xs capitalize ${getRoleColor(member.role || 'member')}`}>
          {isCurrentUser 
            ? (
                member.role === 'super_admin' ? 'Super Admin (You)' :
                member.role === 'admin' ? 'Admin (You)' : 
                `${member.role || 'Member'} (You)`
              )
            : (
                member.role === 'super_admin' ? 'Super Admin' :
                member.role || 'Member'
              )
          }
        </Badge>
        
        {showManagementButtons && (
          <div className="flex items-center gap-1 mt-2">
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => onEditRole(member)}
              className="h-8 w-8 p-0"
            >
              <Settings size={16} />
            </Button>
            {/* Only show remove for admins managing others, not for self-management */}
            {canManageRoles && !isCurrentUser && (
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => onRemove(member)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <X size={16} />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};