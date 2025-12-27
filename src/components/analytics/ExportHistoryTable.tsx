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
} from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/DataTable';
import { createExportHistoryColumns } from '@/components/data-table/columns/export-history-columns';
import { useReportExports, type ReportExport } from '@/hooks/useReportExports';
import { downloadFile } from '@/lib/file-download';
import { toast } from '@/lib/toast';
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

export function ExportHistoryTable() {
  const { exports, loading, deleteExport, getDownloadUrl } = useReportExports();
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ReportExport | null>(null);

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
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Empty state message
  const emptyMessage = exports.length === 0 && !loading ? (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-3 rounded-full bg-muted mb-4">
        <FileX02 className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-foreground mb-1">No exports yet</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        Export your first report using the Export button above. All exports will appear here for easy re-download.
      </p>
    </div>
  ) : "No exports found";

  return (
    <>
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
    </>
  );
}
