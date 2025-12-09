import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
} from '@tanstack/react-table';
import { DataTable } from '@/components/data-table';
import { createTeamColumns } from '@/components/data-table/columns/team-columns';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { TeamMember } from '@/types/team';
import { Users01 } from '@untitledui/icons';

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
  loading,
}) => {
  const columns = React.useMemo(
    () =>
      createTeamColumns({
        currentUserId,
        canManageRoles,
        onEditRole,
        onEditProfile,
        onRemove,
      }),
    [currentUserId, canManageRoles, onEditRole, onEditProfile, onRemove]
  );

  const table = useReactTable({
    data: teamMembers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading) {
    return (
      <div className="w-full bg-card border border-border rounded-xl">
        <LoadingState className="p-8" />
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
      <DataTable
        table={table}
        columns={columns}
        emptyMessage="No team members found"
      />
    </div>
  );
};
