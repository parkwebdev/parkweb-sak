/**
 * Locations Table Columns
 * 
 * Column definitions for the locations data table.
 */

import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Trash01, Eye } from '@untitledui/icons';
import { DataTableColumnHeader } from '../DataTableColumnHeader';
import { US_TIMEZONES } from '@/types/locations';
import type { Tables } from '@/integrations/supabase/types';
import { RowActions, QuickAction } from '@/components/ui/row-actions';
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export type Location = Tables<'locations'>;

export interface LocationWithCounts extends Location {
  calendarCount: number;
}

interface LocationsColumnsProps {
  onView: (location: LocationWithCounts) => void;
  onDelete: (location: LocationWithCounts) => void;
  canManage?: boolean;
}

const getTimezoneLabel = (tzValue: string | null): string => {
  if (!tzValue) return '-';
  const tz = US_TIMEZONES.find(t => t.value === tzValue);
  return tz ? tz.label : tzValue;
};


export const createLocationsColumns = ({
  onView,
  onDelete,
  canManage = true,
}: LocationsColumnsProps): ColumnDef<LocationWithCounts>[] => [
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
  {
    accessorKey: 'name',
    size: 180,
    minSize: 120,
    maxSize: 220,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <span className="font-medium truncate block max-w-[200px]" title={row.original.name}>{row.original.name}</span>
    ),
  },
  {
    id: 'address',
    size: 180,
    minSize: 120,
    maxSize: 220,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Address" />
    ),
    cell: ({ row }) => {
      const { city, state } = row.original;
      if (!city && !state) return <span className="text-muted-foreground">-</span>;
      const addressText = `${city || ''}${city && state ? ', ' : ''}${state || ''}`;
      return <span className="truncate block max-w-[200px]" title={addressText}>{addressText}</span>;
    },
  },
  {
    accessorKey: 'timezone',
    size: 150,
    minSize: 100,
    maxSize: 180,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Timezone" />
    ),
    cell: ({ row }) => (
      <span className="text-sm whitespace-nowrap">{getTimezoneLabel(row.original.timezone)}</span>
    ),
  },
  {
    accessorKey: 'age_category',
    size: 100,
    minSize: 80,
    maxSize: 120,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Age" />,
    cell: ({ row }) => {
      const ageCategory = row.original.age_category;
      if (!ageCategory) return <span className="text-muted-foreground">—</span>;
      
      const is55Plus = ageCategory.toLowerCase().includes('55') || 
                       ageCategory.toLowerCase().includes('senior');
      
      return (
        <Badge variant={is55Plus ? 'secondary' : 'outline'}>
          {is55Plus ? '55+' : 'All-Age'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'pet_policy',
    size: 120,
    minSize: 80,
    maxSize: 150,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pets" />,
    cell: ({ row }) => {
      const petPolicy = row.original.pet_policy;
      if (!petPolicy) return <span className="text-muted-foreground">—</span>;
      
      const truncated = petPolicy.length > 20 
        ? petPolicy.substring(0, 20) + '...' 
        : petPolicy;
      
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-sm cursor-help">{truncated}</span>
          </TooltipTrigger>
          <TooltipContent className="max-w-[300px]">
            <p className="text-sm">{petPolicy}</p>
          </TooltipContent>
        </Tooltip>
      );
    },
  },
  {
    accessorKey: 'amenities',
    size: 100,
    minSize: 70,
    maxSize: 130,
    header: () => <span className="text-xs font-medium">Amenities</span>,
    cell: ({ row }) => {
      const amenities = row.original.amenities as string[] | null;
      if (!amenities || amenities.length === 0) {
        return <span className="text-muted-foreground">—</span>;
      }
      
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="cursor-help">
              {amenities.length}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-[300px]">
            <ul className="text-sm list-disc pl-4">
              {amenities.slice(0, 10).map((amenity, i) => (
                <li key={i}>{amenity}</li>
              ))}
              {amenities.length > 10 && (
                <li className="text-muted-foreground">
                  +{amenities.length - 10} more
                </li>
              )}
            </ul>
          </TooltipContent>
        </Tooltip>
      );
    },
  },
  {
    id: 'calendars',
    size: 90,
    minSize: 70,
    maxSize: 100,
    header: () => <span className="text-xs font-medium">Calendars</span>,
    cell: ({ row }) => {
      const count = row.original.calendarCount;
      if (count === 0) {
        return <span className="text-muted-foreground text-sm">None</span>;
      }
      return (
        <Badge variant="secondary">
          {count}
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
      if (!canManage) return null;
      
      const location = row.original;
      
      const quickActions: QuickAction[] = [
        { 
          icon: Trash01, 
          label: 'Delete', 
          onClick: (e) => {
            e.stopPropagation();
            onDelete(location);
          },
          variant: 'destructive' as const,
        },
      ];
      
      return (
        <RowActions
          quickActions={quickActions}
          menuContent={
            <>
              <DropdownMenuItem onClick={() => onView(location)}>
                <Eye size={14} className="mr-2" aria-hidden="true" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(location)} 
                className="text-destructive focus:text-destructive"
              >
                <Trash01 size={14} className="mr-2" aria-hidden="true" />
                Delete Location
              </DropdownMenuItem>
            </>
          }
        />
      );
    },
  },
];
