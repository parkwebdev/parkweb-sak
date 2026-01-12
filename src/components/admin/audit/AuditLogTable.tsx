/**
 * AuditLogTable Component
 * 
 * Table component for viewing admin audit logs with pagination.
 * 
 * @module components/admin/audit/AuditLogTable
 */

import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  ColumnDef,
} from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FilterLines, 
  ChevronLeft, 
  ChevronRight,
  Settings01,
  Trash01,
  Edit02,
  Plus,
  Eye,
  Send01,
  SwitchHorizontal01
} from '@untitledui/icons';
import { IconButton } from '@/components/ui/icon-button';
import { format } from 'date-fns';
import { getAuditActionLabel, getTargetTypeLabel } from '@/lib/admin/audit-actions';
import { exportToCSV } from '@/lib/admin/admin-utils';
import type { AuditLogEntry, AuditAction, AuditLogFilters as AuditLogFiltersType } from '@/types/admin';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { AuditLogFilters } from './AuditLogFilters';
import { AuditLogDetail } from './AuditLogDetail';
import { AuditLogExport } from './AuditLogExport';

interface AuditLogTableProps {
  entries: AuditLogEntry[];
  loading: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onFiltersChange?: (filters: Partial<AuditLogFiltersType>) => void;
}

const columnHelper = createColumnHelper<AuditLogEntry>();

/**
 * Get icon for audit action.
 */
function getActionIcon(action: AuditAction) {
  const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    impersonation_start: SwitchHorizontal01,
    impersonation_end: SwitchHorizontal01,
    account_suspend: Trash01,
    account_activate: Plus,
    account_delete: Trash01,
    config_update: Settings01,
    plan_create: Plus,
    plan_update: Edit02,
    plan_delete: Trash01,
    team_invite: Plus,
    team_remove: Trash01,
    article_create: Plus,
    article_update: Edit02,
    article_delete: Trash01,
    category_create: Plus,
    category_update: Edit02,
    category_delete: Trash01,
    email_send: Send01,
    announcement_send: Send01,
  };
  return iconMap[action] || Settings01;
}

/**
 * Audit log table with pagination.
 */
export function AuditLogTable({
  entries,
  loading,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onFiltersChange,
}: AuditLogTableProps) {
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const totalPages = Math.ceil(totalCount / pageSize);

  const columns = useMemo<ColumnDef<AuditLogEntry, unknown>[]>(
    () => [
      columnHelper.accessor('action', {
        header: 'Action',
        cell: ({ getValue, row }) => {
          const action = getValue();
          const Icon = getActionIcon(action);
          return (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                <Icon size={14} className="text-muted-foreground" aria-hidden="true" />
              </div>
              <span className="text-sm font-medium">{getAuditActionLabel(action)}</span>
            </div>
          );
        },
      }),
      columnHelper.accessor('admin_email', {
        header: 'Admin',
        cell: ({ getValue, row }) => (
          <div>
            <p className="text-sm">{row.original.admin_name || getValue()}</p>
            {row.original.admin_name && (
              <p className="text-xs text-muted-foreground">{getValue()}</p>
            )}
          </div>
        ),
      }),
      columnHelper.accessor('target_type', {
        header: 'Target',
        cell: ({ getValue, row }) => (
          <div>
            <Badge variant="outline" className="text-2xs">
              {getTargetTypeLabel(getValue())}
            </Badge>
            {row.original.target_email && (
              <p className="text-xs text-muted-foreground mt-1">{row.original.target_email}</p>
            )}
          </div>
        ),
      }),
      columnHelper.accessor('created_at', {
        header: 'Time',
        cell: ({ getValue }) => (
          <div>
            <p className="text-sm">{format(new Date(getValue()), 'MMM d, yyyy')}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(getValue()), 'h:mm a')}
            </p>
          </div>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <IconButton
            label="View details"
            variant="ghost"
            size="sm"
            onClick={() => setSelectedEntry(row.original)}
          >
            <Eye size={14} />
          </IconButton>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: entries,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleExport = () => {
    const exportData = entries.map(e => ({
      created_at: e.created_at,
      action: e.action,
      admin_email: e.admin_email,
      target_type: e.target_type || '',
      target_email: e.target_email || '',
      ip_address: e.ip_address || '',
    }));
    exportToCSV(
      exportData,
      `audit-log-${format(new Date(), 'yyyy-MM-dd')}`,
      [
        { key: 'created_at', label: 'Timestamp' },
        { key: 'action', label: 'Action' },
        { key: 'admin_email', label: 'Admin Email' },
        { key: 'target_type', label: 'Target Type' },
        { key: 'target_email', label: 'Target Email' },
        { key: 'ip_address', label: 'IP Address' },
      ]
    );
  };

  return (
    <div className="space-y-4">
      {/* Header with filters and export */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <AuditLogFilters onApply={(filters) => {
                onFiltersChange?.(filters);
                setFiltersOpen(false);
              }} />
            </PopoverContent>
          </Popover>
          <p className="text-sm text-muted-foreground">
            {totalCount} log{totalCount !== 1 ? 's' : ''} found
          </p>
        </div>
        <AuditLogExport onExport={handleExport} />
      </div>

      {/* Table */}
      <DataTable
        table={table}
        columns={columns}
        isLoading={loading}
        emptyMessage="No audit logs found"
      />

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
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

      {/* Detail Sheet */}
      <AuditLogDetail
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />
    </div>
  );
}

