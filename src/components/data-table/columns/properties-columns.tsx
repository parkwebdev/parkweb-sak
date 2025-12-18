import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DataTableColumnHeader } from '../DataTableColumnHeader';
import { AlertTriangle, LinkExternal01 } from '@untitledui/icons';
import { formatPrice, type PropertyStatus } from '@/types/properties';
import type { PropertyWithLocation } from '@/hooks/useProperties';

const statusVariants: Record<PropertyStatus, 'default' | 'secondary' | 'outline'> = {
  available: 'default',
  pending: 'secondary',
  sold: 'outline',
  rented: 'outline',
  coming_soon: 'secondary',
};

const statusLabels: Record<PropertyStatus, string> = {
  available: 'Available',
  pending: 'Pending',
  sold: 'Sold',
  rented: 'Rented',
  coming_soon: 'Coming Soon',
};

export const createPropertiesColumns = (): ColumnDef<PropertyWithLocation>[] => [
  {
    id: 'select',
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
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },
  {
    accessorKey: 'address',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Address" />,
    cell: ({ row }) => {
      const address = row.original.address;
      const city = row.original.city;
      const state = row.original.state;
      
      return (
        <div className="flex flex-col whitespace-nowrap">
          <span className="font-medium text-sm">{address || 'No address'}</span>
          {(city || state) && (
            <span className="text-xs text-muted-foreground">
              {[city, state].filter(Boolean).join(', ')}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'lot_number',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Lot #" />,
    cell: ({ row }) => {
      const lotNumber = row.original.lot_number;
      
      if (!lotNumber) {
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500">
                <AlertTriangle size={14} />
                <span className="text-xs">Missing</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Missing lot number - update in WordPress</p>
            </TooltipContent>
          </Tooltip>
        );
      }
      
      return <span className="font-mono text-sm">{lotNumber}</span>;
    },
    size: 80,
  },
  {
    accessorKey: 'location_name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Community" />,
    cell: ({ row }) => {
      const locationName = row.original.location_name;
      
      if (!locationName) {
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500">
                <AlertTriangle size={14} />
                <span className="text-xs">Unmatched</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Not matched to any community</p>
            </TooltipContent>
          </Tooltip>
        );
      }
      
      return <span className="text-sm whitespace-nowrap">{locationName}</span>;
    },
  },
  {
    id: 'beds_baths',
    header: 'Beds/Baths',
    cell: ({ row }) => {
      const beds = row.original.beds;
      const baths = row.original.baths;
      
      if (!beds && !baths) return <span className="text-muted-foreground text-sm">—</span>;
      
      return (
        <span className="text-sm whitespace-nowrap">
          {beds ?? '—'} bd / {baths ?? '—'} ba
        </span>
      );
    },
    size: 100,
  },
  {
    accessorKey: 'price',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Price" />,
    cell: ({ row }) => {
      const price = row.original.price;
      const priceType = row.original.price_type;
      
      return (
        <span className="font-medium text-sm whitespace-nowrap">
          {formatPrice(price, priceType ?? undefined)}
        </span>
      );
    },
    size: 120,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = (row.original.status as PropertyStatus) || 'available';
      
      return (
        <Badge variant={statusVariants[status]}>
          {statusLabels[status]}
        </Badge>
      );
    },
    size: 100,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const listingUrl = row.original.listing_url;
      
      if (!listingUrl) return null;
      
      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={(e) => {
            e.stopPropagation();
            window.open(listingUrl, '_blank', 'noopener,noreferrer');
          }}
        >
          <LinkExternal01 size={16} />
          <span className="sr-only">View listing</span>
        </Button>
      );
    },
    size: 60,
  },
];
