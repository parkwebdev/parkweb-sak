/**
 * Locations Table Columns
 * 
 * Column definitions for the locations data table.
 */

import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Trash01 } from '@untitledui/icons';
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

// WordPress "W" logo as inline SVG component
const WordPressIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zM3.5 12c0-1.466.386-2.842 1.058-4.036l5.825 15.963C6.105 22.303 3.5 17.533 3.5 12zm8.5 8.5c-.834 0-1.64-.12-2.41-.345l2.56-7.436 2.622 7.182c.017.042.038.08.059.118A8.458 8.458 0 0112 20.5zm1.076-12.554c.514-.027.977-.081.977-.081.46-.054.406-.73-.054-.703 0 0-1.38.108-2.27.108-.837 0-2.243-.108-2.243-.108-.459-.027-.513.676-.054.703 0 0 .436.054.896.081l1.33 3.646-1.869 5.606-3.109-9.252c.513-.027.976-.081.976-.081.46-.054.406-.73-.053-.703 0 0-1.38.108-2.27.108-.16 0-.348-.003-.547-.01C5.962 5.171 8.769 3.5 12 3.5c2.406 0 4.596.918 6.24 2.424-.04-.002-.079-.007-.12-.007-1.051 0-1.796.915-1.796 1.897 0 .881.508 1.627 1.05 2.508.406.703.879 1.608.879 2.914 0 .906-.348 1.956-.811 3.419l-1.065 3.559-3.801-11.26zm4.872 11.196l2.58-7.456c.482-1.205.643-2.169.643-3.026 0-.311-.02-.6-.057-.867A8.481 8.481 0 0120.5 12c0 4.85-2.644 9.078-6.552 11.142z"/>
  </svg>
);

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
        <WordPressIcon className="h-4 w-4 text-wordpress" />
      );
    },
  },
  {
    id: 'actions',
    header: () => <span>Actions</span>,
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
