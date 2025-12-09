import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '../DataTableColumnHeader';

export interface LandingPageData {
  url: string;
  visits: number;
  avgDuration: number;
  conversions: number;
  agentName?: string;
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
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Page" />
    ),
    cell: ({ row }) => (
      <span
        className="font-mono text-xs max-w-[200px] truncate block"
        title={row.original.url}
      >
        {formatUrl(row.original.url)}
      </span>
    ),
    filterFn: (row, id, value) => {
      const url = row.original.url.toLowerCase();
      const agentName = row.original.agentName?.toLowerCase() || '';
      const searchValue = value.toLowerCase();
      return url.includes(searchValue) || agentName.includes(searchValue);
    },
  },
  {
    accessorKey: 'visits',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Visits" className="justify-end" />
    ),
    cell: ({ row }) => (
      <span className="text-right block">{row.original.visits}</span>
    ),
  },
  {
    accessorKey: 'avgDuration',
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
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Leads" className="justify-end" />
    ),
    cell: ({ row }) => (
      <span className="text-right block">{row.original.conversions}</span>
    ),
  },
  {
    accessorKey: 'agentName',
    header: 'Agent',
    cell: ({ row }) =>
      row.original.agentName ? (
        <Badge variant="secondary" className="text-xs">
          {row.original.agentName}
        </Badge>
      ) : null,
    enableSorting: false,
  },
];
