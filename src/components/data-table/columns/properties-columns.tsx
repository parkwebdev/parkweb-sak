import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DataTableColumnHeader } from '../DataTableColumnHeader';
import { AlertTriangle, LinkExternal01 } from '@untitledui/icons';
import { formatPrice, type PropertyStatus } from '@/types/properties';
import type { PropertyWithLocation } from '@/hooks/useProperties';
import { RowActions, QuickAction } from '@/components/ui/row-actions';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

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
      const address = row.original.address || 'No address';
      
      return (
        <span className="font-medium text-sm truncate max-w-[260px]" title={address}>
          {address}
        </span>
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
              <div className="flex items-center gap-1.5 text-warning">
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
              <div className="flex items-center gap-1.5 text-warning">
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
    accessorKey: 'sqft',
    size: 90,
    minSize: 70,
    maxSize: 110,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Sqft" />,
    cell: ({ row }) => {
      const sqft = row.original.sqft;
      if (!sqft) return <span className="text-muted-foreground text-sm">—</span>;
      return (
        <span className="text-sm tabular-nums">
          {sqft.toLocaleString()}
        </span>
      );
    },
  },
  {
    accessorKey: 'year_built',
    size: 70,
    minSize: 60,
    maxSize: 90,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Year" />,
    cell: ({ row }) => {
      const year = row.original.year_built;
      if (!year) return <span className="text-muted-foreground text-sm">—</span>;
      return <span className="text-sm tabular-nums">{year}</span>;
    },
  },
  {
    id: 'make_model',
    size: 140,
    minSize: 100,
    maxSize: 180,
    header: () => <span className="text-xs font-medium">Make/Model</span>,
    cell: ({ row }) => {
      const manufacturer = row.original.manufacturer;
      const model = row.original.model;
      
      if (!manufacturer && !model) {
        return <span className="text-muted-foreground text-sm">—</span>;
      }
      
      const combined = [manufacturer, model].filter(Boolean).join(' ');
      const truncated = combined.length > 18 
        ? combined.substring(0, 18) + '...' 
        : combined;
      
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-sm truncate block max-w-[160px] cursor-help">
              {truncated}
            </span>
          </TooltipTrigger>
          {combined.length > 18 && (
            <TooltipContent>
              <p>{combined}</p>
            </TooltipContent>
          )}
        </Tooltip>
      );
    },
  },
  {
    accessorKey: 'lot_rent',
    size: 100,
    minSize: 80,
    maxSize: 120,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Lot Rent" />,
    cell: ({ row }) => {
      const lotRent = row.original.lot_rent;
      if (!lotRent) return <span className="text-muted-foreground text-sm">—</span>;
      
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(lotRent / 100);
      
      return (
        <span className="text-sm tabular-nums whitespace-nowrap">
          {formatted}/mo
        </span>
      );
    },
  },
  {
    accessorKey: 'features',
    size: 90,
    minSize: 70,
    maxSize: 110,
    header: () => <span className="text-xs font-medium">Features</span>,
    cell: ({ row }) => {
      const features = row.original.features as string[] | null;
      if (!features || features.length === 0) {
        return <span className="text-muted-foreground text-sm">—</span>;
      }
      
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="cursor-help">
              {features.length}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-[300px]">
            <ul className="text-sm list-disc pl-4">
              {features.slice(0, 10).map((feature, i) => (
                <li key={i}>{feature}</li>
              ))}
              {features.length > 10 && (
                <li className="text-muted-foreground">
                  +{features.length - 10} more
                </li>
              )}
            </ul>
          </TooltipContent>
        </Tooltip>
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
    size: 100,
    minSize: 80,
    maxSize: 120,
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      const listingUrl = row.original.listing_url;
      
      if (!listingUrl) return null;
      
      const quickActions: QuickAction[] = [
        { 
          icon: LinkExternal01, 
          label: 'View Listing', 
          onClick: (e) => {
            e.stopPropagation();
            window.open(listingUrl, '_blank', 'noopener,noreferrer');
          },
        },
      ];
      
      return (
        <RowActions
          quickActions={quickActions}
          menuContent={
            <DropdownMenuItem 
              onClick={() => window.open(listingUrl, '_blank', 'noopener,noreferrer')}
            >
              <LinkExternal01 size={14} className="mr-2" aria-hidden="true" />
              View Listing
            </DropdownMenuItem>
          }
        />
      );
    },
  },
];
