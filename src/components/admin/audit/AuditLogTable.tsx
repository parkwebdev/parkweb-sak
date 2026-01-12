/**
 * Audit Log Components
 * 
 * Components for viewing and filtering admin audit logs.
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Download01, 
  FilterLines, 
  ChevronLeft, 
  ChevronRight,
  User01,
  Settings01,
  Trash01,
  Edit02,
  Plus,
  Eye,
  Send01,
  SwitchHorizontal01
} from '@untitledui/icons';
import { format, formatDistanceToNow } from 'date-fns';
import { getAuditActionLabel, getTargetTypeLabel } from '@/lib/admin/audit-actions';
import { exportToCSV, parseUserAgent } from '@/lib/admin/admin-utils';
import type { AuditLogEntry, AuditAction, AuditTargetType, AuditLogFilters as AuditLogFiltersType } from '@/types/admin';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedEntry(row.original)}
          >
            <Eye size={14} aria-hidden="true" />
          </Button>
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
                <FilterLines size={14} className="mr-1" aria-hidden="true" />
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

interface FilterProps {
  action?: AuditAction;
  targetType?: AuditTargetType;
  search: string;
}

/**
 * Audit log filters component.
 */
export function AuditLogFilters({
  onApply,
}: {
  onApply: (filters: FilterProps) => void;
}) {
  const [action, setAction] = useState<AuditAction | ''>('');
  const [targetType, setTargetType] = useState<AuditTargetType | ''>('');
  const [search, setSearch] = useState('');

  const actionOptions: AuditAction[] = [
    'impersonation_start',
    'impersonation_end',
    'account_suspend',
    'account_activate',
    'account_delete',
    'config_update',
    'plan_create',
    'plan_update',
    'plan_delete',
    'team_invite',
    'team_remove',
    'article_create',
    'article_update',
    'article_delete',
    'email_send',
    'announcement_send',
  ];

  const targetTypes: AuditTargetType[] = ['account', 'config', 'plan', 'team', 'article', 'category', 'email'];

  const handleApply = () => {
    onApply({
      action: action || undefined,
      targetType: targetType || undefined,
      search,
    });
  };

  const handleClear = () => {
    setAction('');
    setTargetType('');
    setSearch('');
    onApply({ search: '' });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Action</Label>
        <Select value={action} onValueChange={(v) => setAction(v as AuditAction | '')}>
          <SelectTrigger>
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All actions</SelectItem>
            {actionOptions.map((a) => (
              <SelectItem key={a} value={a}>
                {getAuditActionLabel(a)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Target Type</Label>
        <Select value={targetType} onValueChange={(v) => setTargetType(v as AuditTargetType | '')}>
          <SelectTrigger>
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            {targetTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {getTargetTypeLabel(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Search</Label>
        <Input
          placeholder="Search by email or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={handleClear} className="flex-1">
          Clear
        </Button>
        <Button size="sm" onClick={handleApply} className="flex-1">
          Apply
        </Button>
      </div>
    </div>
  );
}

/**
 * Audit log detail view.
 */
export function AuditLogDetail({
  entry,
  onClose,
}: {
  entry: AuditLogEntry | null;
  onClose: () => void;
}) {
  if (!entry) return null;

  return (
    <Sheet open={!!entry} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Audit Log Details</SheetTitle>
          <SheetDescription>
            {format(new Date(entry.created_at), 'MMMM d, yyyy h:mm:ss a')}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Action */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Action</Label>
            <div className="flex items-center gap-2">
              <Badge>{getAuditActionLabel(entry.action)}</Badge>
            </div>
          </div>

          {/* Admin */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Performed By</Label>
            <p className="text-sm font-medium">{entry.admin_name || entry.admin_email}</p>
            {entry.admin_name && (
              <p className="text-xs text-muted-foreground">{entry.admin_email}</p>
            )}
          </div>

          {/* Target */}
          {entry.target_type && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Target</Label>
              <div>
                <Badge variant="outline" className="mb-1">
                  {getTargetTypeLabel(entry.target_type)}
                </Badge>
                {entry.target_email && (
                  <p className="text-sm">{entry.target_email}</p>
                )}
                {entry.target_id && (
                  <p className="text-xs text-muted-foreground font-mono">{entry.target_id}</p>
                )}
              </div>
            </div>
          )}

          {/* Details */}
          {Object.keys(entry.details).length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Details</Label>
              <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                {JSON.stringify(entry.details, null, 2)}
              </pre>
            </div>
          )}

          {/* Metadata */}
          <div className="space-y-3 pt-4 border-t border-border">
            {entry.ip_address && (
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">IP Address</Label>
                <span className="text-sm font-mono">{entry.ip_address}</span>
              </div>
            )}
            {entry.user_agent && (
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Browser</Label>
                <span className="text-sm">{parseUserAgent(entry.user_agent)}</span>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Export button component.
 */
export function AuditLogExport({
  onExport,
}: {
  onExport: () => void;
}) {
  return (
    <Button variant="outline" size="sm" onClick={onExport}>
      <Download01 size={14} className="mr-1" aria-hidden="true" />
      Export CSV
    </Button>
  );
}
