import { ColumnDef } from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '../DataTableColumnHeader';
import type { Tables } from '@/integrations/supabase/types';

export type Lead = Tables<'leads'>;

interface LeadsColumnsProps {
  onView: (lead: Lead) => void;
  onStageChange: (leadId: string, stageId: string) => void;
  StatusDropdown: React.ComponentType<{ stageId: string | null; onStageChange: (stageId: string) => void }>;
}

export const createLeadsColumns = ({
  onStageChange,
  StatusDropdown,
}: LeadsColumnsProps): ColumnDef<Lead>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={`Select ${row.original.name || 'lead'}`}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
    maxSize: 40,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.original.name || '-'}</span>
    ),
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => row.original.email || '-',
  },
  {
    accessorKey: 'phone',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phone" />
    ),
    cell: ({ row }) => {
      // Check direct phone column first, then look in data JSONB for common phone field names
      const directPhone = row.original.phone;
      if (directPhone) return directPhone;
      
      const data = (row.original.data || {}) as Record<string, unknown>;
      const phoneFromData = data['Phone Number'] || data['phone'] || data['Phone'] || data['phoneNumber'];
      return phoneFromData ? String(phoneFromData) : '-';
    },
  },
  {
    accessorKey: 'stage_id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Stage" />
    ),
    cell: ({ row }) => (
      <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
        <StatusDropdown
          stageId={row.original.stage_id}
          onStageChange={(stageId) => onStageChange(row.original.id, stageId)}
        />
      </div>
    ),
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) =>
      formatDistanceToNow(new Date(row.original.created_at), { addSuffix: true }),
  },
];
