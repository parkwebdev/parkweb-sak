import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DotsHorizontal, Settings01, X } from '@untitledui/icons';
import { TeamMember } from '@/types/team';

interface TeamColumnsProps {
  currentUserId?: string;
  canManageRoles: boolean;
  onEditRole: (member: TeamMember) => void;
  onEditProfile?: (member: TeamMember) => void;
  onRemove: (member: TeamMember) => void;
}

const getBadgeVariant = (role: string) => {
  switch (role) {
    case 'admin':
      return 'default' as const;
    case 'manager':
      return 'secondary' as const;
    default:
      return 'outline' as const;
  }
};

const formatRole = (role: string) => {
  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getInitials = (displayName: string | null, email: string | null) => {
  if (displayName) {
    return displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return 'U';
};

export const createTeamColumns = ({
  currentUserId,
  canManageRoles,
  onEditRole,
  onEditProfile,
  onRemove,
}: TeamColumnsProps): ColumnDef<TeamMember>[] => [
  {
    accessorKey: 'display_name',
    size: 280,
    minSize: 200,
    maxSize: 350,
    header: 'Team Member',
    cell: ({ row }) => {
      const member = row.original;
      const displayName = member.display_name || 'No name provided';
      const email = member.email || '';
      return (
        <div className="flex items-center space-x-3 min-w-0">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={member.avatar_url || ''} />
            <AvatarFallback className="text-xs">
              {getInitials(member.display_name, member.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <div className="font-medium text-sm truncate max-w-[200px]" title={displayName}>
              {displayName}
            </div>
            <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={email}>
              {email}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'role',
    size: 120,
    minSize: 80,
    maxSize: 150,
    header: 'Role',
    cell: ({ row }) => (
      <Badge
        variant={getBadgeVariant(row.original.role || 'member')}
        className="whitespace-nowrap"
      >
        {formatRole(row.original.role || 'member')}
      </Badge>
    ),
  },
  {
    id: 'actions',
    size: 80,
    minSize: 60,
    maxSize: 100,
    header: () => <span className="w-24">Actions</span>,
    cell: ({ row }) => {
      const member = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <DotsHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canManageRoles && (
              <DropdownMenuItem onClick={() => onEditRole(member)}>
                <Settings01 className="mr-2 h-4 w-4" />
                Manage Role
              </DropdownMenuItem>
            )}
            {onEditProfile && (
              <DropdownMenuItem onClick={() => onEditProfile(member)}>
                <Settings01 className="mr-2 h-4 w-4" />
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
      );
    },
  },
];
