import { ColumnDef } from '@tanstack/react-table';
import { RoleBadge } from '@/components/admin/shared/RoleBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { RowActions, type QuickAction } from '@/components/ui/row-actions';
import { Settings02, Edit05, Trash01 } from '@untitledui/icons';
import { TeamMember } from '@/types/team';
import { getInitials } from '@/lib/formatting-utils';

interface TeamColumnsProps {
  currentUserId?: string;
  currentUserRole?: string;
  canManageRoles: boolean;
  onEditRole: (member: TeamMember) => void;
  onEditProfile?: (member: TeamMember) => void;
  onRemove: (member: TeamMember) => void;
}


export const createTeamColumns = ({
  currentUserId,
  currentUserRole,
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
    header: () => <span className="text-xs font-medium">Team Member</span>,
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
    header: () => <span className="text-xs font-medium">Role</span>,
    cell: ({ row }) => (
      <RoleBadge role={row.original.role || 'member'} className="whitespace-nowrap" />
    ),
  },
  {
    id: 'actions',
    size: 100,
    minSize: 80,
    maxSize: 120,
    header: () => <span className="text-xs font-medium">Actions</span>,
    cell: ({ row }) => {
      const member = row.original;
      const isOwnRow = member.user_id === currentUserId;
      const isAdmin = currentUserRole === 'admin';
      // Hide "Manage Role" for admins viewing their own row
      const showManageRole = canManageRoles && !(isOwnRow && isAdmin);
      const showRemove = canManageRoles && member.user_id !== currentUserId;

      // Quick actions shown on hover
      const quickActions: QuickAction[] = [
        {
          icon: Settings02,
          label: 'Manage Role',
          onClick: (e) => { e.stopPropagation(); onEditRole(member); },
          show: showManageRole,
        },
        {
          icon: Edit05,
          label: 'Edit Profile',
          onClick: (e) => { e.stopPropagation(); onEditProfile?.(member); },
          show: !!onEditProfile,
        },
        {
          icon: Trash01,
          label: 'Remove',
          onClick: (e) => { e.stopPropagation(); onRemove(member); },
          variant: 'destructive',
          show: showRemove,
        },
      ];
      
      return (
        <RowActions
          quickActions={quickActions}
          menuContent={
            <>
              {showManageRole && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditRole(member); }}>
                  <Settings02 size={14} className="mr-2" aria-hidden="true" />
                  Manage Role
                </DropdownMenuItem>
              )}
              {onEditProfile && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditProfile(member); }}>
                  <Edit05 size={14} className="mr-2" aria-hidden="true" />
                  Edit Profile
                </DropdownMenuItem>
              )}
              {showRemove && (
                <>
                  {(showManageRole || onEditProfile) && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); onRemove(member); }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash01 size={14} className="mr-2" aria-hidden="true" />
                    Remove Member
                  </DropdownMenuItem>
                </>
              )}
            </>
          }
        />
      );
    },
  },
];
