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
import { DataTableFloatingBar } from '@/components/data-table/DataTableFloatingBar';
import { createExportHistoryColumns } from '@/components/data-table/columns/export-history-columns';
import { useReportExports, type ReportExport } from '@/hooks/useReportExports';
import { downloadFile, downloadFilesAsZip } from '@/lib/file-download';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog';
import { FileX02, Trash01, Download01 } from '@untitledui/icons';
import { format } from 'date-fns';

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
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
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

  // Handle bulk download as ZIP
  const handleBulkDownload = useCallback(async () => {
    const selectedIndices = Object.keys(rowSelection);
    const selectedExports = selectedIndices
      .map((index) => exports[parseInt(index)])
      .filter(Boolean);
    
    if (selectedExports.length === 0) return;
    
    setIsBulkDownloading(true);
    
    try {
      // Build file list with signed URLs
      const files: { url: string; fileName: string }[] = [];
      
      for (const exportItem of selectedExports) {
        const url = await getDownloadUrl(exportItem.file_path);
        if (url) {
          const extension = exportItem.format === 'csv' ? 'csv' : 'pdf';
          // Always include creation date for uniqueness and context
          const fileName = `${exportItem.name} (${format(new Date(exportItem.created_at), 'yyyy-MM-dd')}).${extension}`;
          files.push({ url, fileName });
        }
      }
      
      if (files.length === 0) {
        toast.error('No files to download');
        return;
      }
      
      // Generate ZIP filename with date
      const zipFileName = `reports-export-${format(new Date(), 'yyyy-MM-dd')}.zip`;
      
      await downloadFilesAsZip(files, zipFileName);
      
      toast.success(`Downloaded ${files.length} report${files.length > 1 ? 's' : ''}`);
      setRowSelection({});
    } catch {
      toast.error('Failed to create download');
    } finally {
      setIsBulkDownloading(false);
    }
  }, [rowSelection, exports, getDownloadUrl]);

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
      <DataTable
        table={table}
        columns={columns}
        isLoading={loading}
        emptyMessage={emptyMessage}
      />

      {/* Floating bar for bulk actions */}
      <DataTableFloatingBar table={table}>
        <Button
          variant="outline"
          size="sm"
          onClick={handleBulkDownload}
          disabled={isBulkDownloading}
        >
          {isBulkDownloading ? (
            <Spinner size="sm" className="mr-1.5" />
          ) : (
            <Download01 className="mr-1.5 size-4" aria-hidden="true" />
          )}
          {isBulkDownloading ? 'Downloading...' : 'Download'}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setIsBulkDeleteOpen(true)}
        >
          <Trash01 className="mr-1.5 size-4" aria-hidden="true" />
          Delete
        </Button>
      </DataTableFloatingBar>

      {/* Delete confirmation dialog */}
      <DeleteConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Export"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This will permanently remove the file.`}
        onConfirm={handleDeleteConfirm}
      />

      {/* Bulk delete confirmation dialog */}
      <DeleteConfirmationDialog
        open={isBulkDeleteOpen}
        onOpenChange={setIsBulkDeleteOpen}
        title={`Delete ${selectedCount} Export${selectedCount > 1 ? 's' : ''}`}
        description={`Are you sure you want to delete ${selectedCount} export${selectedCount > 1 ? 's' : ''}? This will permanently remove the files.`}
        onConfirm={handleBulkDelete}
        actionLabel={`Delete ${selectedCount} Export${selectedCount > 1 ? 's' : ''}`}
      />
    </>
  );
}
