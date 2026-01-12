/**
 * AccountsTable Component
 * 
 * Data table for displaying admin accounts with pagination.
 * 
 * @module components/admin/accounts/AccountsTable
 */

import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  ColumnDef,
} from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/DataTable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from '@untitledui/icons';
import { AccountStatusBadge } from './AccountStatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { getInitials } from '@/lib/admin/admin-utils';
import type { AdminAccount } from '@/types/admin';

interface AccountsTableProps {
  accounts: AdminAccount[];
  loading: boolean;
  totalCount: number;
  page: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onSelectAccount: (accountId: string) => void;
}

const columnHelper = createColumnHelper<AdminAccount>();

/**
 * Table component for displaying admin accounts.
 */
export function AccountsTable({
  accounts,
  loading,
  totalCount,
  page,
  pageSize = 25,
  onPageChange,
  onSelectAccount,
}: AccountsTableProps) {
  const totalPages = Math.ceil(totalCount / pageSize);

  const columns = useMemo<ColumnDef<AdminAccount, unknown>[]>(
    () => [
      columnHelper.accessor('display_name', {
        header: 'Account',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={row.original.avatar_url || undefined} />
              <AvatarFallback className="text-2xs">
                {getInitials(row.original.display_name || row.original.email)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-foreground">
                {row.original.display_name || 'No name'}
              </p>
              <p className="text-xs text-muted-foreground">{row.original.email}</p>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('company_name', {
        header: 'Company',
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">
            {getValue() || '—'}
          </span>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ getValue }) => <AccountStatusBadge status={getValue()} />,
      }),
      columnHelper.accessor('plan_name', {
        header: 'Plan',
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue() || 'Free'}</span>
        ),
      }),
      columnHelper.accessor('agent_count', {
        header: 'Agents',
        cell: ({ getValue }) => (
          <span className="text-sm font-mono">{getValue()}</span>
        ),
      }),
      columnHelper.accessor('conversation_count', {
        header: 'Convos (30d)',
        cell: ({ getValue }) => (
          <span className="text-sm font-mono">{getValue()}</span>
        ),
      }),
      columnHelper.accessor('created_at', {
        header: 'Created',
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(getValue()), { addSuffix: true })}
          </span>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: accounts,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <DataTable
        table={table}
        columns={columns}
        isLoading={loading}
        onRowClick={(row) => onSelectAccount(row.user_id)}
        emptyMessage="No accounts found"
      />

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {accounts.length} of {totalCount} accounts
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft size={16} aria-hidden="true" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Next
            <ChevronRight size={16} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
