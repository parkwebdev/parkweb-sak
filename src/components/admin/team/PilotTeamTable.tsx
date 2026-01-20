/**
 * PilotTeamTable Component
 * 
 * Displays and manages the Pilot internal team using DataTable.
 * 
 * @module components/admin/team/PilotTeamTable
 */

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
} from '@tanstack/react-table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RoleBadge } from '@/components/admin/shared/RoleBadge';
import { IconButton } from '@/components/ui/icon-button';
import { Trash01, Shield01 } from '@untitledui/icons';
import { formatDistanceToNow } from 'date-fns';
import { getInitials } from '@/lib/admin/admin-utils';
import { DataTable } from '@/components/data-table/DataTable';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springs } from '@/lib/motion-variants';
import type { PilotTeamMember } from '@/types/admin';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PilotTeamTableProps {
  team: PilotTeamMember[];
  loading: boolean;
  onRemove: (userId: string) => Promise<void>;
  isRemoving?: boolean;
}

/**
 * Pilot team management component using DataTable.
 */
export function PilotTeamTable({
  team,
  loading,
  onRemove,
  isRemoving,
}: PilotTeamTableProps) {
  const prefersReducedMotion = useReducedMotion();
  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null);

  const handleRemove = async () => {
    if (removeConfirmId) {
      await onRemove(removeConfirmId);
      setRemoveConfirmId(null);
    }
  };

  const columns: ColumnDef<PilotTeamMember>[] = useMemo(
    () => [
      {
        accessorKey: 'display_name',
        header: 'Member',
        size: 280,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={row.original.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {getInitials(row.original.display_name || row.original.email)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {row.original.display_name || 'Unnamed'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {row.original.email}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Role',
        size: 120,
        cell: ({ row }) => <RoleBadge role={row.original.role} />,
      },
      {
        accessorKey: 'created_at',
        header: 'Added',
        size: 140,
        cell: ({ row }) => {
          const value = row.original.created_at;
          return value ? (
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(value), { addSuffix: true })}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: 'last_login_at',
        header: 'Last Login',
        size: 140,
        cell: ({ row }) => {
          const value = row.original.last_login_at;
          return value ? (
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(value), { addSuffix: true })}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">Never</span>
          );
        },
      },
      {
        accessorKey: 'audit_action_count',
        header: 'Actions',
        size: 80,
        cell: ({ row }) => (
          <span className="text-sm font-mono text-muted-foreground">
            {row.original.audit_action_count}
          </span>
        ),
      },
      {
        id: 'remove',
        header: '',
        size: 48,
        cell: ({ row }) => (
          <IconButton
            label="Remove team member"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setRemoveConfirmId(row.original.user_id);
            }}
          >
            <Trash01 size={14} className="text-destructive" aria-hidden="true" />
          </IconButton>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: team,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!loading && team.length === 0) {
    return (
      <motion.div 
        className="rounded-lg border border-border bg-card p-8 text-center"
        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={springs.smooth}
      >
        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4">
          <Shield01 size={24} className="text-muted-foreground" aria-hidden="true" />
        </div>
        <p className="text-sm text-muted-foreground">No team members found</p>
      </motion.div>
    );
  }

  return (
    <>
      <DataTable
        table={table}
        columns={columns}
        isLoading={loading}
        emptyMessage="No team members found"
      />

      {/* Remove Confirmation */}
      <AlertDialog open={!!removeConfirmId} onOpenChange={() => setRemoveConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove Pilot team access from this user. They will be downgraded to a regular admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-destructive text-destructive-foreground"
              disabled={isRemoving}
            >
              {isRemoving ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
