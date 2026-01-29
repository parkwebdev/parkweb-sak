/**
 * Export History Table Columns
 * 
 * Column definitions for the report exports data table.
 * Follows the same patterns as locations-columns.tsx for consistency.
 */

import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Download01, Trash01 } from '@untitledui/icons';
import { PdfIcon, CsvIcon } from '@/components/analytics/ExportIcons';
import { DataTableColumnHeader } from '../DataTableColumnHeader';
import { formatDateRangeFromStrings, formatFileSize } from '@/lib/formatting-utils';
import { format } from 'date-fns';
import { formatShortTime } from '@/lib/time-formatting';
import type { ReportExport } from '@/hooks/useReportExports';
import { RowActions, QuickAction } from '@/components/ui/row-actions';
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

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
 * Create export history table columns
 */
export const createExportHistoryColumns = ({
  onDownload,
  onDelete,
}: ExportHistoryColumnsProps): ColumnDef<ReportExport>[] => [
  // Selection column
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
          aria-label={`Select ${row.original.name}`}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  
  // Report name with format icon
  {
    id: 'name',
    accessorKey: 'name',
    size: 240,
    minSize: 180,
    maxSize: 320,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Report" />
    ),
    cell: ({ row }) => {
      const exportItem = row.original;
      const Icon = exportItem.format === 'pdf' ? PdfIcon : CsvIcon;
      
      return (
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0">
            <Icon className="h-6 w-6" />
          </div>
          <span className="font-medium truncate block max-w-[180px]" title={exportItem.name}>
            {exportItem.name}
          </span>
        </div>
      );
    },
  },
  
  // Date range
  {
    id: 'dateRange',
    size: 160,
    minSize: 120,
    maxSize: 200,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date Range" />
    ),
    cell: ({ row }) => {
      const exportItem = row.original;
      return (
        <span className="text-muted-foreground whitespace-nowrap">
          {formatDateRangeFromStrings(exportItem.date_range_start, exportItem.date_range_end)}
        </span>
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
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Size" />
    ),
    cell: ({ row }) => {
      return (
        <span className="text-muted-foreground">
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
    size: 110,
    minSize: 90,
    maxSize: 140,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      const date = row.original.created_at;
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-muted-foreground whitespace-nowrap cursor-default">
              {formatShortTime(new Date(date))}
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
    size: 100,
    minSize: 80,
    maxSize: 120,
    meta: { align: 'right' as const },
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      const exportItem = row.original;
      
      const quickActions: QuickAction[] = [
        { 
          icon: Download01, 
          label: 'Download', 
          onClick: (e) => {
            e.stopPropagation();
            onDownload(exportItem);
          },
        },
        { 
          icon: Trash01, 
          label: 'Delete', 
          onClick: (e) => {
            e.stopPropagation();
            onDelete(exportItem);
          },
          variant: 'destructive' as const,
        },
      ];
      
      return (
        <RowActions
          quickActions={quickActions}
          menuContent={
            <>
              <DropdownMenuItem onClick={() => onDownload(exportItem)}>
                <Download01 size={14} className="mr-2" aria-hidden="true" />
                Download Report
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(exportItem)} 
                className="text-destructive focus:text-destructive"
              >
                <Trash01 size={14} className="mr-2" aria-hidden="true" />
                Delete Report
              </DropdownMenuItem>
            </>
          }
        />
      );
    },
  },
];
