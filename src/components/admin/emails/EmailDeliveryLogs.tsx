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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
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
        cell: ({ getValue }) => {
          const status = getValue();
          const variant = status === 'delivered' ? 'default' : status === 'bounced' || status === 'failed' ? 'destructive' : 'secondary';
          return <Badge variant={variant}>{status}</Badge>;
        },
      }),
      logColumnHelper.accessor('created_at', {
        header: 'Sent',
        cell: ({ getValue }) => {
          const val = getValue();
          return (
            <span className="text-xs text-muted-foreground">
              {val ? formatDistanceToNow(new Date(val), { addSuffix: true }) : '—'}
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Delivery Logs</CardTitle>
        <CardDescription>Recent email delivery status</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          table={table}
          columns={columns}
          isLoading={loading}
          emptyMessage="No delivery logs found"
        />
      </CardContent>
    </Card>
  );
}
