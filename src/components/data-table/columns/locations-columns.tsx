/**
 * Locations Table Columns
 * 
 * Column definitions for the locations data table.
 */

import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash01 } from '@untitledui/icons';
import { DataTableColumnHeader } from '../DataTableColumnHeader';
import { US_TIMEZONES } from '@/types/locations';
import { WordPressIcon } from '@/components/icons/WordPressIcon';
import type { Tables } from '@/integrations/supabase/types';

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
    size: 80,
    minSize: 60,
    maxSize: 90,
    header: () => <span className="text-xs font-medium">Actions</span>,
    cell: ({ row }) => (
      canManage ? (
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(row.original)}
          >
            <Trash01 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      ) : null
    ),
  },
];
