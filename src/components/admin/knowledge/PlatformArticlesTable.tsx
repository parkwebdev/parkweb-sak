/**
 * PlatformArticlesTable Component
 * 
 * Data table for displaying and managing platform help articles
 * with row selection for bulk operations.
 * 
 * @module components/admin/knowledge/PlatformArticlesTable
 */

import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  createColumnHelper,
  ColumnDef,
  SortingState,
  RowSelectionState,
} from '@tanstack/react-table';
import { DataTable, DataTableFloatingBar } from '@/components/data-table';
import { DataTableColumnHeader } from '@/components/data-table/DataTableColumnHeader';
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog';
import { StatusBadge } from '@/components/admin/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash01 } from '@untitledui/icons';
import { PlatformArticleActions } from './PlatformArticleActions';
import { formatDistanceToNow } from 'date-fns';
import type { PlatformHCArticle } from '@/types/platform-hc';

interface PlatformArticlesTableProps {
  articles: PlatformHCArticle[];
  loading: boolean;
  onDelete: (articleId: string) => Promise<void>;
  onBulkDelete?: (ids: string[]) => Promise<void>;
  onRowClick?: (article: PlatformHCArticle) => void;
}

const columnHelper = createColumnHelper<PlatformHCArticle>();

/**
 * Table component for displaying platform help articles with bulk selection.
 */
export function PlatformArticlesTable({
  articles,
  loading,
  onDelete,
  onBulkDelete,
  onRowClick,
}: PlatformArticlesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  
  // Single delete state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSingleDeleting, setIsSingleDeleting] = useState(false);
  
  // Bulk delete state
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const handleSingleDelete = async () => {
    if (!deleteConfirmId) return;
    setIsSingleDeleting(true);
    try {
      await onDelete(deleteConfirmId);
    } finally {
      setIsSingleDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!onBulkDelete) return;
    setIsBulkDeleting(true);
    try {
      const selectedIds = table.getFilteredSelectedRowModel().rows.map(row => row.original.id);
      await onBulkDelete(selectedIds);
      setRowSelection({});
    } finally {
      setIsBulkDeleting(false);
      setBulkDeleteOpen(false);
    }
  };

  const columns = useMemo<ColumnDef<PlatformHCArticle, string | number | boolean | null>[]>(
    () => [
      // Checkbox column for row selection
      {
        id: 'select',
        size: 40,
        minSize: 40,
        maxSize: 40,
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label={`Select ${row.original.title}`}
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      columnHelper.accessor('title', {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Title" />
        ),
        cell: ({ getValue, row }) => (
          <div className="space-y-0.5">
            <span className="text-sm font-medium">{getValue()}</span>
            <p className="text-xs text-muted-foreground truncate max-w-[300px]">
              {row.original.description}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor('category_label', {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Category" />
        ),
        cell: ({ getValue, row }) => {
          const color = row.original.category_color || 'bg-muted';
          return (
            <Badge variant="outline" className="gap-1.5">
              <span className={`w-2 h-2 rounded-full ${color}`} aria-hidden="true" />
              {getValue()}
            </Badge>
          );
        },
      }),
      columnHelper.accessor('is_published', {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ getValue }) => (
          <StatusBadge status={getValue() ? 'Published' : 'Draft'} />
        ),
      }),
      columnHelper.accessor('order_index', {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Order" />
        ),
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{getValue()}</span>
        ),
      }),
      columnHelper.accessor('updated_at', {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Updated" />
        ),
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(getValue()), { addSuffix: true })}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        size: 60,
        cell: ({ row }) => (
          <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
            <PlatformArticleActions
              onDelete={() => setDeleteConfirmId(row.original.id)}
            />
          </div>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: articles,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="space-y-4">
      <DataTable
        table={table}
        columns={columns}
        isLoading={loading}
        emptyMessage="No articles yet. Create your first article to get started."
        onRowClick={onRowClick}
      />

      {/* Floating action bar for bulk delete */}
      <DataTableFloatingBar table={table}>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setBulkDeleteOpen(true)}
          className="h-7"
        >
          <Trash01 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </DataTableFloatingBar>

      {/* Single Delete Confirmation */}
      <DeleteConfirmationDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        title="Delete Article"
        description="This will permanently delete this article. This action cannot be undone."
        onConfirm={handleSingleDelete}
        isDeleting={isSingleDeleting}
      />

      {/* Bulk Delete Confirmation */}
      <DeleteConfirmationDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Delete Articles"
        description={`This will permanently delete ${selectedCount} article${selectedCount !== 1 ? 's' : ''}. This action cannot be undone.`}
        onConfirm={handleBulkDelete}
        isDeleting={isBulkDeleting}
      />
    </div>
  );
}
