/**
 * Export History Table
 * 
 * TanStack DataTable component for displaying report export history.
 * Allows users to re-download or delete past exports.
 */

import { useMemo, useState, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  RowSelectionState,
} from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/DataTable';
import { createExportHistoryColumns } from '@/components/data-table/columns/export-history-columns';
import { useReportExports, type ReportExport } from '@/hooks/useReportExports';
import { downloadFile } from '@/lib/file-download';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
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
import { FileX02 } from '@untitledui/icons';

interface ExportHistoryTableProps {
  /** Optional external loading state override */
  loading?: boolean;
}

export function ExportHistoryTable({ loading: externalLoading }: ExportHistoryTableProps) {
  const { exports, loading: internalLoading, deleteExport, getDownloadUrl } = useReportExports();
  const loading = externalLoading ?? internalLoading;
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isDownloading, setIsDownloading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ReportExport | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Handle download
  const handleDownload = useCallback(async (exportItem: ReportExport) => {
    setIsDownloading(true);
    try {
      const url = await getDownloadUrl(exportItem.file_path);
      if (url) {
        const extension = exportItem.format === 'csv' ? 'csv' : 'pdf';
        const fileName = `${exportItem.name}.${extension}`;
        await downloadFile(url, fileName);
        toast.success('Download started');
      }
    } catch {
      toast.error('Failed to download file');
    } finally {
      setIsDownloading(false);
    }
  }, [getDownloadUrl]);

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(() => {
    if (deleteTarget) {
      deleteExport(deleteTarget.id);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteExport]);

  // Handle bulk delete
  const handleBulkDelete = useCallback(() => {
    const selectedIds = Object.keys(rowSelection);
    selectedIds.forEach((index) => {
      const exportItem = exports[parseInt(index)];
      if (exportItem) {
        deleteExport(exportItem.id);
      }
    });
    setRowSelection({});
    setIsBulkDeleteOpen(false);
  }, [rowSelection, exports, deleteExport]);

  // Memoize columns
  const columns = useMemo(() => createExportHistoryColumns({
    onDownload: handleDownload,
    onDelete: setDeleteTarget,
    isDownloading,
  }), [handleDownload, isDownloading]);

  // Create table instance
  const table = useReactTable({
    data: exports,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
  });

  // Selected count
  const selectedCount = Object.keys(rowSelection).length;

  // Empty state message
  const emptyMessage = exports.length === 0 && !loading ? (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="p-3 rounded-full bg-muted mb-4">
        <FileX02 className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-foreground mb-1">No exports yet</h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
        Export your first report using the Export button above. All exports will appear here for easy re-download.
      </p>
    </div>
  ) : "No exports found";

  return (
    <>
      {/* Bulk actions bar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md mb-4">
          <span className="text-sm text-muted-foreground">
            {selectedCount} selected
          </span>
          <Button size="sm" variant="ghost" onClick={() => setRowSelection({})}>
            Clear
          </Button>
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={() => setIsBulkDeleteOpen(true)}
          >
            Delete Selected
          </Button>
        </div>
      )}

      <DataTable
        table={table}
        columns={columns}
        isLoading={loading}
        emptyMessage={emptyMessage}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Export</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This will permanently remove the file and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirmation dialog */}
      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} Exports</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCount} export{selectedCount > 1 ? 's' : ''}? This will permanently remove the files and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedCount} Export{selectedCount > 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
