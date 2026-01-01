/**
 * @fileoverview Team members data table with role and profile management.
 * Uses TanStack Table with custom column definitions.
 */

import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
} from '@tanstack/react-table';
import { DataTable } from '@/components/data-table';
import { createTeamColumns } from '@/components/data-table/columns/team-columns';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonTeamTable } from '@/components/ui/page-skeleton';
import { TeamMember } from '@/types/team';
import { Users01 } from '@untitledui/icons';

interface TeamMembersTableProps {
  teamMembers: TeamMember[];
  currentUserId?: string;
  currentUserRole?: string;
  canManageRoles: boolean;
  onEditRole: (member: TeamMember) => void;
  onEditProfile?: (member: TeamMember) => void;
  onRemove: (member: TeamMember) => void;
  loading?: boolean;
}

export const TeamMembersTable = React.memo(function TeamMembersTable({
  teamMembers,
  currentUserId,
  currentUserRole,
  canManageRoles,
  onEditRole,
  onEditProfile,
  onRemove,
  loading,
}: TeamMembersTableProps) {
  const columns = React.useMemo(
    () =>
      createTeamColumns({
        currentUserId,
        currentUserRole,
        canManageRoles,
        onEditRole,
        onEditProfile,
        onRemove,
      }),
    [currentUserId, currentUserRole, canManageRoles, onEditRole, onEditProfile, onRemove]
  );

  const table = useReactTable({
    data: teamMembers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading) {
    return <SkeletonTeamTable />;
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
    <DataTable
      table={table}
      columns={columns}
      emptyMessage="No team members found"
    />
  );
});
