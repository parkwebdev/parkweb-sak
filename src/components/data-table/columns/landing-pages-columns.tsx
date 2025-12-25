import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '../DataTableColumnHeader';

export interface LandingPageData {
  url: string;
  visits: number;
  avgDuration: number;
  conversions: number;
}

const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
};

const formatUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    let path = parsed.pathname + parsed.search;
    if (path === '/') path = '/ (home)';
    return path.length > 50 ? path.substring(0, 47) + '...' : path;
  } catch {
    return url.length > 50 ? url.substring(0, 47) + '...' : url;
  }
};

export const landingPagesColumns: ColumnDef<LandingPageData>[] = [
  {
    accessorKey: 'url',
    size: 250,
    minSize: 150,
    maxSize: 350,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Page" />
    ),
    cell: ({ row }) => {
      const formattedUrl = formatUrl(row.original.url);
      return (
        <span
          className="font-mono text-xs truncate block max-w-[320px]"
          title={row.original.url}
        >
          {formattedUrl}
        </span>
      );
    },
    filterFn: (row, id, value) => {
      const url = row.original.url.toLowerCase();
      const searchValue = value.toLowerCase();
      return url.includes(searchValue);
    },
  },
  {
    accessorKey: 'visits',
    size: 80,
    minSize: 60,
    maxSize: 100,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Visits" className="justify-end" />
    ),
    cell: ({ row }) => (
      <span className="text-right block">{row.original.visits}</span>
    ),
  },
  {
    accessorKey: 'avgDuration',
    size: 100,
    minSize: 80,
    maxSize: 120,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Avg. Time" className="justify-end" />
    ),
    cell: ({ row }) => (
      <span className="text-right text-muted-foreground block">
        {formatDuration(row.original.avgDuration)}
      </span>
    ),
  },
  {
    accessorKey: 'conversions',
    size: 80,
    minSize: 60,
    maxSize: 100,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Leads" className="justify-end" />
    ),
    cell: ({ row }) => (
      <span className="text-right block">{row.original.conversions}</span>
    ),
  },
];
