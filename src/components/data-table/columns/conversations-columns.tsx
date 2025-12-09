import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Edit02, Trash01 } from '@untitledui/icons';
import { DataTableColumnHeader } from '../DataTableColumnHeader';
import { cn } from '@/lib/utils';

export interface ConversationRow {
  id: string;
  agentName: string;
  leadName?: string;
  messageCount: number;
  duration: string;
  percentageOfTotal: number;
  status: 'active' | 'human_takeover' | 'closed';
  createdAt: string;
}

const statusConfig = {
  active: { label: 'Active', className: 'bg-success/10 text-success border-success/20' },
  human_takeover: { label: 'Human', className: 'bg-info/10 text-info border-info/20' },
  closed: { label: 'Closed', className: 'bg-muted text-muted-foreground border-border' },
};

interface ConversationsColumnsOptions {
  onView?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const createConversationsColumns = (
  options: ConversationsColumnsOptions = {}
): ColumnDef<ConversationRow>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() ? 'indeterminate' : false)
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'agentName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Agent / Lead" />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium text-foreground">{row.original.agentName}</span>
        {row.original.leadName && (
          <span className="text-sm text-muted-foreground">{row.original.leadName}</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'messageCount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Messages" />
    ),
    cell: ({ row }) => (
      <span className="font-medium tabular-nums">
        {row.original.messageCount.toLocaleString()}
      </span>
    ),
  },
  {
    accessorKey: 'duration',
    header: 'Duration',
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">{row.original.duration}</span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'percentageOfTotal',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="% of Total" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-3 w-32">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-500 rounded-full transition-all"
            style={{ width: `${Math.min(row.original.percentageOfTotal, 100)}%` }}
          />
        </div>
        <span className="text-sm tabular-nums text-muted-foreground w-12 text-right">
          {row.original.percentageOfTotal.toFixed(1)}%
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      const config = statusConfig[status];
      return (
        <Badge variant="outline" className={cn('font-medium border', config.className)}>
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full mr-1.5',
              status === 'active' && 'bg-success',
              status === 'human_takeover' && 'bg-info',
              status === 'closed' && 'bg-muted-foreground'
            )}
          />
          {config.label}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {options.onView && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => options.onView?.(row.original.id)}
          >
            <Edit02 className="h-4 w-4" />
          </Button>
        )}
        {options.onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => options.onDelete?.(row.original.id)}
          >
            <Trash01 className="h-4 w-4" />
          </Button>
        )}
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
