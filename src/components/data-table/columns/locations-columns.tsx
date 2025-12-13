/**
 * Locations Table Columns
 * 
 * Column definitions for the locations data table.
 */

import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Trash01, CheckCircle } from '@untitledui/icons';
import { DataTableColumnHeader } from '../DataTableColumnHeader';
import { US_TIMEZONES } from '@/types/locations';
import type { Tables } from '@/integrations/supabase/types';

export type Location = Tables<'locations'>;

export interface LocationWithCounts extends Location {
  calendarCount: number;
}

interface LocationsColumnsProps {
  onView: (location: LocationWithCounts) => void;
  onDelete: (location: LocationWithCounts) => void;
}

const getTimezoneLabel = (tzValue: string | null): string => {
  if (!tzValue) return '-';
  const tz = US_TIMEZONES.find(t => t.value === tzValue);
  return tz ? tz.label : tzValue;
};

export const createLocationsColumns = ({
  onView,
  onDelete,
}: LocationsColumnsProps): ColumnDef<LocationWithCounts>[] => [
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
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label={`Select ${row.original.name}`}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.original.name}</span>
    ),
  },
  {
    id: 'address',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Address" />
    ),
    cell: ({ row }) => {
      const { city, state } = row.original;
      if (!city && !state) return <span className="text-muted-foreground">-</span>;
      return `${city || ''}${city && state ? ', ' : ''}${state || ''}`;
    },
  },
  {
    accessorKey: 'timezone',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Timezone" />
    ),
    cell: ({ row }) => (
      <span className="text-sm">{getTimezoneLabel(row.original.timezone)}</span>
    ),
  },
  {
    id: 'calendars',
    header: () => <span>Calendars</span>,
    cell: ({ row }) => {
      const count = row.original.calendarCount;
      if (count === 0) {
        return <span className="text-muted-foreground text-sm">None</span>;
      }
      return (
        <Badge variant="secondary" className="text-xs">
          {count}
        </Badge>
      );
    },
  },
  {
    id: 'wordpress',
    header: () => <span>WordPress</span>,
    cell: ({ row }) => {
      const hasWordPress = row.original.wordpress_community_id || row.original.wordpress_slug;
      if (!hasWordPress) {
        return <span className="text-muted-foreground text-sm">-</span>;
      }
      return (
        <CheckCircle className="h-4 w-4 text-emerald-500" />
      );
    },
  },
  {
    id: 'actions',
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView(row.original)}
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(row.original)}
        >
          <Trash01 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
        </Button>
      </div>
    ),
  },
];
