/**
 * EmailDeliveryLogs Component
 * 
 * Table for displaying email delivery status.
 * 
 * @module components/admin/emails/EmailDeliveryLogs
 */

import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  ColumnDef,
} from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/DataTable';

import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/admin/shared/StatusBadge';
import { formatShortTime } from '@/lib/time-formatting';
import type { EmailDeliveryLog } from '@/types/admin';

interface EmailDeliveryLogsProps {
  /** List of delivery logs */
  logs: EmailDeliveryLog[];
  /** Loading state */
  loading: boolean;
}

const logColumnHelper = createColumnHelper<EmailDeliveryLog>();

/**
 * Email delivery logs table.
 */
export function EmailDeliveryLogs({ logs, loading }: EmailDeliveryLogsProps) {
  const columns = useMemo<ColumnDef<EmailDeliveryLog, unknown>[]>(
    () => [
      logColumnHelper.accessor('to_email', {
        header: 'Recipient',
        cell: ({ getValue }) => (
          <span className="text-sm font-mono">{getValue()}</span>
        ),
      }),
      logColumnHelper.accessor('subject', {
        header: 'Subject',
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
            {getValue() || '—'}
          </span>
        ),
      }),
      logColumnHelper.accessor('template_type', {
        header: 'Type',
        cell: ({ getValue }) => (
          <Badge variant="outline" className="text-2xs">
            {getValue() || 'transactional'}
          </Badge>
        ),
      }),
      logColumnHelper.accessor('status', {
        header: 'Status',
        cell: ({ getValue }) => <StatusBadge status={getValue()} type="email" />,
      }),
      logColumnHelper.accessor('created_at', {
        header: 'Sent',
        cell: ({ getValue }) => {
          const val = getValue();
          return (
            <span className="text-xs text-muted-foreground">
              {val ? formatShortTime(new Date(val)) : '—'}
            </span>
          );
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data: logs,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <DataTable
      table={table}
      columns={columns}
      isLoading={loading}
      emptyMessage="No delivery logs found"
    />
  );
}
