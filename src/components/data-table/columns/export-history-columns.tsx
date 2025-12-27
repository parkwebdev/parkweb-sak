/**
 * Export History Table Columns
 * 
 * Column definitions for the report exports data table.
 * Follows the same patterns as other column files for consistency.
 */

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Download01, Trash01, File06, FileCode02 } from '@untitledui/icons';
import { DataTableColumnHeader } from '../DataTableColumnHeader';
import { format, formatDistanceToNow } from 'date-fns';
import type { ReportExport } from '@/hooks/useReportExports';

/**
 * Props for creating export history columns
 */
export interface ExportHistoryColumnsProps {
  /** Handler for downloading an export */
  onDownload: (exportItem: ReportExport) => void;
  /** Handler for deleting an export */
  onDelete: (exportItem: ReportExport) => void;
  /** Whether download is in progress */
  isDownloading?: boolean;
}

/**
 * Format file size in human-readable format
 */
const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/**
 * Format date range
 */
const formatDateRange = (start: string, end: string): string => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  // Same month and year
  if (
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear()
  ) {
    return `${format(startDate, 'MMM d')} - ${format(endDate, 'd, yyyy')}`;
  }
  
  // Same year
  if (startDate.getFullYear() === endDate.getFullYear()) {
    return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
  }
  
  return `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
};

/**
 * Create export history table columns
 */
export const createExportHistoryColumns = ({
  onDownload,
  onDelete,
}: ExportHistoryColumnsProps): ColumnDef<ReportExport>[] => [
  // Report name with format icon
  {
    id: 'name',
    accessorKey: 'name',
    size: 280,
    minSize: 180,
    maxSize: 400,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Report" />
    ),
    cell: ({ row }) => {
      const exportItem = row.original;
      const Icon = exportItem.format === 'pdf' ? File06 : FileCode02;
      
      return (
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-1.5 rounded-md shrink-0 ${exportItem.format === 'pdf' ? 'bg-destructive/10' : 'bg-primary/10'}`}>
            <Icon className={`h-4 w-4 ${exportItem.format === 'pdf' ? 'text-destructive' : 'text-primary'}`} />
          </div>
          <span className="font-medium truncate" title={exportItem.name}>
            {exportItem.name}
          </span>
        </div>
      );
    },
  },
  
  // Date range
  {
    id: 'dateRange',
    size: 180,
    minSize: 140,
    maxSize: 220,
    header: () => <span>Date Range</span>,
    cell: ({ row }) => {
      const exportItem = row.original;
      return (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDateRange(exportItem.date_range_start, exportItem.date_range_end)}
        </span>
      );
    },
    enableSorting: false,
  },
  
  // Format badge
  {
    id: 'format',
    accessorKey: 'format',
    size: 80,
    minSize: 60,
    maxSize: 100,
    header: () => <span>Format</span>,
    cell: ({ row }) => {
      const format = row.original.format;
      return (
        <Badge 
          variant={format === 'pdf' ? 'destructive' : 'default'}
          className="text-xs uppercase"
        >
          {format}
        </Badge>
      );
    },
    enableSorting: false,
  },
  
  // File size
  {
    id: 'fileSize',
    accessorKey: 'file_size',
    size: 80,
    minSize: 60,
    maxSize: 100,
    header: () => <span>Size</span>,
    cell: ({ row }) => {
      return (
        <span className="text-sm text-muted-foreground">
          {formatFileSize(row.original.file_size)}
        </span>
      );
    },
    enableSorting: false,
  },
  
  // Created date
  {
    id: 'createdAt',
    accessorKey: 'created_at',
    size: 120,
    minSize: 100,
    maxSize: 160,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      const date = row.original.created_at;
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-sm text-muted-foreground whitespace-nowrap cursor-default">
              {formatDistanceToNow(new Date(date), { addSuffix: true })}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {format(new Date(date), 'PPpp')}
          </TooltipContent>
        </Tooltip>
      );
    },
  },
  
  // Actions column
  {
    id: 'actions',
    size: 90,
    minSize: 70,
    maxSize: 100,
    header: () => <span>Actions</span>,
    cell: ({ row }) => {
      const exportItem = row.original;
      
      return (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDownload(exportItem)}
                className="h-8 w-8 p-0"
              >
                <Download01 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(exportItem)}
                className="h-8 w-8 p-0"
              >
                <Trash01 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete</p>
            </TooltipContent>
          </Tooltip>
        </div>
      );
    },
  },
];
