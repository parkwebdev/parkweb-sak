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
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'address',
    size: 200,
    minSize: 150,
    maxSize: 280,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Address" />,
    cell: ({ row }) => {
      const address = row.original.address;
      const city = row.original.city;
      const state = row.original.state;
      const fullAddress = address || 'No address';
      const location = [city, state].filter(Boolean).join(', ');
      
      return (
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-sm truncate max-w-[260px]" title={fullAddress}>{fullAddress}</span>
          {location && (
            <span className="text-xs text-muted-foreground truncate max-w-[260px]" title={location}>
              {location}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'lot_number',
    size: 80,
    minSize: 60,
    maxSize: 100,
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
  },
  {
    accessorKey: 'location_name',
    size: 160,
    minSize: 100,
    maxSize: 200,
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
      
      return <span className="text-sm truncate block max-w-[180px]" title={locationName}>{locationName}</span>;
    },
  },
  {
    id: 'beds_baths',
    size: 100,
    minSize: 80,
    maxSize: 120,
    header: () => <span className="text-xs font-medium">Beds/Baths</span>,
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
  },
  {
    accessorKey: 'price',
    size: 120,
    minSize: 90,
    maxSize: 150,
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
  },
  {
    accessorKey: 'status',
    size: 110,
    minSize: 80,
    maxSize: 130,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = (row.original.status as PropertyStatus) || 'available';
      
      return (
        <Badge variant={statusVariants[status]}>
          {statusLabels[status]}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    size: 60,
    minSize: 50,
    maxSize: 70,
    header: () => <span className="text-xs font-medium">Actions</span>,
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
  },
];
