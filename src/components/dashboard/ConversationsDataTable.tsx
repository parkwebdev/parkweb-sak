/**
 * @fileoverview Conversations data table with filtering, sorting, and bulk actions.
 * Features tabbed navigation, search, date/status/agent filters, row selection,
 * and delete confirmations with persistent sort state.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  SortingState,
  RowSelectionState,
} from '@tanstack/react-table';
import {
  SearchMd,
  FilterLines,
  Calendar,
  Check,
  User01,
  Trash01,
} from '@untitledui/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { SimpleDeleteDialog } from '@/components/ui/simple-delete-dialog';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table';
import { createConversationsColumns, ConversationRow } from '@/components/data-table/columns';
import { cn } from '@/lib/utils';

interface TabConfig {
  id: string;
  label: string;
  count?: number;
}

interface ConversationsDataTableProps {
  data: ConversationRow[];
  tabs: TabConfig[];
  selectedTab: string;
  onTabChange: (tabId: string) => void;
  onDelete?: (ids: string[]) => Promise<void>;
  title?: string;
  className?: string;
  storageKey?: string;
}

type DateFilter = 'all' | 'today' | '7days' | '30days';
type StatusFilter = 'all' | 'active' | 'human_takeover' | 'closed';

const STORAGE_PREFIX = 'dashboard_table_sort_';

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

function loadSortState(key: string): SortingState | null {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return null;
}

function saveSortState(key: string, state: SortingState): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(state));
  } catch {}
}

export function ConversationsDataTable({
  data,
  tabs,
  selectedTab,
  onTabChange,
  onDelete,
  title = 'Conversations',
  className,
  storageKey = 'conversations',
}: ConversationsDataTableProps) {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [sorting, setSorting] = useState<SortingState>(() => {
    const stored = loadSortState(storageKey);
    return stored || [{ id: 'messageCount', desc: true }];
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const dateFilterOptions = [
    { id: 'all' as DateFilter, label: 'All time' },
    { id: 'today' as DateFilter, label: 'Today' },
    { id: '7days' as DateFilter, label: 'Last 7 days' },
    { id: '30days' as DateFilter, label: 'Last 30 days' },
  ];

  const statusFilterOptions = [
    { id: 'all' as StatusFilter, label: 'All statuses' },
    { id: 'active' as StatusFilter, label: 'Active' },
    { id: 'human_takeover' as StatusFilter, label: 'Human' },
    { id: 'closed' as StatusFilter, label: 'Closed' },
  ];

  useEffect(() => {
    saveSortState(storageKey, sorting);
  }, [sorting, storageKey]);

  const filteredData = useMemo(() => {
    let filtered = data;

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      if (dateFilter === 'today') {
        cutoff.setHours(0, 0, 0, 0);
      } else if (dateFilter === '7days') {
        cutoff.setDate(now.getDate() - 7);
      } else if (dateFilter === '30days') {
        cutoff.setDate(now.getDate() - 30);
      }
      filtered = filtered.filter((row) => new Date(row.createdAt) >= cutoff);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((row) => row.status === statusFilter);
    }

    // Apply search filter
    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (row) =>
          row.agentName.toLowerCase().includes(searchLower) ||
          (row.leadName?.toLowerCase().includes(searchLower) ?? false)
      );
    }

    return filtered;
  }, [data, debouncedSearch, dateFilter, statusFilter]);

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteTarget(id);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete([deleteTarget]);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      // Clear selection if deleted row was selected
      if (rowSelection[deleteTarget]) {
        const newSelection = { ...rowSelection };
        delete newSelection[deleteTarget];
        setRowSelection(newSelection);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedRowIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);

  const handleBulkDeleteClick = () => {
    if (selectedRowIds.length === 0) return;
    setBulkDeleteDialogOpen(true);
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedRowIds.length === 0 || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(selectedRowIds);
      setBulkDeleteDialogOpen(false);
      setRowSelection({});
    } finally {
      setIsDeleting(false);
    }
  };

  // Count active filters
  const activeFilterCount = [
    dateFilter !== 'all',
    statusFilter !== 'all',
  ].filter(Boolean).length;

  const columns = useMemo(
    () =>
      createConversationsColumns({
        onView: (id) => navigate(`/conversations?id=${id}`),
        onDelete: onDelete ? handleDeleteClick : undefined,
      }),
    [navigate, onDelete, handleDeleteClick]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <Card className={cn('overflow-hidden border-border/50', className)}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>

      {/* Tabs + Search/Filter Row */}
      <div className="px-5 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Segmented Tabs */}
        <div className="flex items-center bg-muted/80 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap',
                selectedTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'ml-1.5 text-xs',
                    selectedTab === tab.id ? 'text-muted-foreground' : 'text-muted-foreground/70'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <SearchMd className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 pr-4 h-8 w-[200px] bg-background"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <FilterLines className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-2xs font-medium text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date
              </DropdownMenuLabel>
              {dateFilterOptions.map((option) => (
                <DropdownMenuItem
                  key={option.id}
                  onClick={() => setDateFilter(option.id)}
                  className="flex items-center justify-between"
                >
                  {option.label}
                  {dateFilter === option.id && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="flex items-center gap-2">
                <User01 className="h-4 w-4" />
                Status
              </DropdownMenuLabel>
              {statusFilterOptions.map((option) => (
                <DropdownMenuItem
                  key={option.id}
                  onClick={() => setStatusFilter(option.id)}
                  className="flex items-center justify-between"
                >
                  {option.label}
                  {statusFilter === option.id && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="border-t border-border/50">
        <DataTable
          table={table}
          columns={columns}
          emptyMessage={debouncedSearch ? 'No matching conversations found' : 'No conversations found'}
        />
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="border-t border-border/50 px-5 py-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedRowIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-lg">
          <span className="text-sm font-medium text-foreground">
            {selectedRowIds.length} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDeleteClick}
            className="gap-2"
          >
            <Trash01 className="h-4 w-4" />
            Delete Selected
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setRowSelection({})}>
            Clear
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <SimpleDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Conversation"
        description="Are you sure you want to delete this conversation? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <SimpleDeleteDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        title="Delete Conversations"
        description={`Are you sure you want to delete ${selectedRowIds.length} conversation${selectedRowIds.length > 1 ? 's' : ''}? This action cannot be undone.`}
        onConfirm={handleConfirmBulkDelete}
        isDeleting={isDeleting}
      />
    </Card>
  );
}

// Re-export the type for backward compatibility
export type { ConversationRow };
