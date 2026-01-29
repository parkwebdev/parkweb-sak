import { ColumnDef } from '@tanstack/react-table';
import { formatShortTime } from '@/lib/time-formatting';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { RowActions, type QuickAction } from '@/components/ui/row-actions';
import { DataTableColumnHeader } from '../DataTableColumnHeader';
import { LeadAssigneePicker } from '@/components/leads/LeadAssigneePicker';
import { normalizePriority } from '@/lib/priority-config';
import { PHONE_FIELD_KEYS } from '@/lib/field-keys';
import { Eye } from '@untitledui/icons';
import type { Tables } from '@/integrations/supabase/types';

export type Lead = Tables<'leads'> & {
  conversations?: {
    id: string;
    created_at: string;
    metadata?: unknown;
  } | null;
};

interface LeadsColumnsProps {
  onView: (lead: Lead) => void;
  onStageChange: (leadId: string, stageId: string) => void;
  onPriorityChange?: (leadId: string, conversationId: string, priority: string) => void;
  onAddAssignee?: (leadId: string, userId: string) => void;
  onRemoveAssignee?: (leadId: string, userId: string) => void;
  getAssignees: (leadId: string) => string[];
  StatusDropdown: React.ComponentType<{ stageId: string | null; onStageChange: (stageId: string) => void }>;
  PriorityDropdown: React.ComponentType<{ priority: string | null | undefined; onPriorityChange: (priority: string) => void }>;
}

export const createLeadsColumns = ({
  onView,
  onStageChange,
  onPriorityChange,
  onAddAssignee,
  onRemoveAssignee,
  getAssignees,
  StatusDropdown,
  PriorityDropdown,
}: LeadsColumnsProps): ColumnDef<Lead>[] => [
  {
    id: 'select',
    size: 40,
    minSize: 40,
    maxSize: 40,
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
  },
  {
    accessorKey: 'name',
    size: 160,
    minSize: 120,
    maxSize: 200,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const name = row.original.name || '-';
      return (
        <span className="font-medium truncate block" title={name !== '-' ? name : undefined}>
          {name}
        </span>
      );
    },
  },
  {
    accessorKey: 'email',
    size: 200,
    minSize: 150,
    maxSize: 280,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => {
      const email = row.original.email || '-';
      return (
        <span className="truncate block" title={email !== '-' ? email : undefined}>
          {email}
        </span>
      );
    },
  },
  {
    accessorKey: 'phone',
    size: 130,
    minSize: 100,
    maxSize: 150,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phone" />
    ),
    cell: ({ row }) => {
      // Primary: Use dedicated phone column (populated by edge function)
      if (row.original.phone) return row.original.phone;
      
      // Fallback for legacy leads: Search data JSONB for common phone field names
      const data = (row.original.data || {}) as Record<string, unknown>;
      for (const key of PHONE_FIELD_KEYS) {
        if (data[key]) return String(data[key]);
      }
      return '-';
    },
  },
  {
    accessorKey: 'stage_id',
    size: 140,
    minSize: 100,
    maxSize: 180,
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
    id: 'priority',
    size: 100,
    minSize: 80,
    maxSize: 120,
    accessorFn: (row) => {
      const metadata = row.conversations?.metadata as Record<string, unknown> | undefined;
      return metadata?.priority ?? 'none';
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Priority" />
    ),
    cell: ({ row }) => {
      const metadata = row.original.conversations?.metadata as Record<string, unknown> | undefined;
      const priority = metadata?.priority as string | undefined;
      const conversationId = row.original.conversation_id;
      
      return (
        <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
          <PriorityDropdown
            priority={priority}
            onPriorityChange={(newPriority) => {
              if (conversationId && onPriorityChange) {
                onPriorityChange(row.original.id, conversationId, newPriority);
              }
            }}
          />
        </div>
      );
    },
    sortingFn: (rowA, rowB) => {
      const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1, none: 0 };
      const metadataA = rowA.original.conversations?.metadata as Record<string, unknown> | undefined;
      const metadataB = rowB.original.conversations?.metadata as Record<string, unknown> | undefined;
      const priorityA = normalizePriority(metadataA?.priority as string | undefined);
      const priorityB = normalizePriority(metadataB?.priority as string | undefined);
      return priorityOrder[priorityA] - priorityOrder[priorityB];
    },
  },
  {
    accessorKey: 'location',
    size: 140,
    minSize: 100,
    maxSize: 180,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Location" />
    ),
    cell: ({ row }) => {
      const data = (row.original.data || {}) as Record<string, unknown>;
      const city = data['city'] || data['City'];
      const state = data['state'] || data['State'];
      
      let locationText = '-';
      if (city && state) {
        locationText = `${city}, ${state}`;
      } else if (city) {
        locationText = String(city);
      } else if (state) {
        locationText = String(state);
      } else {
        // Try to get location from metadata if conversation is linked
        const conversations = row.original.conversations;
        if (conversations?.metadata) {
          const metadata = conversations.metadata as Record<string, unknown>;
          if (metadata.city && metadata.state) {
            locationText = `${metadata.city}, ${metadata.state}`;
          } else if (metadata.city) {
            locationText = String(metadata.city);
          } else if (metadata.state) {
            locationText = String(metadata.state);
          } else if (metadata.country) {
            locationText = String(metadata.country);
          }
        }
      }
      
      return (
        <span className="truncate block" title={locationText !== '-' ? locationText : undefined}>
          {locationText}
        </span>
      );
    },
  },
  {
    accessorKey: 'source',
    size: 140,
    minSize: 100,
    maxSize: 180,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Source" />
    ),
    cell: ({ row }) => {
      let sourceText = '-';
      const conversations = row.original.conversations;
      
      if (conversations?.metadata) {
        const metadata = conversations.metadata as Record<string, unknown>;
        
        // Check referrer_journey first (most accurate)
        const referrerJourney = metadata.referrer_journey as Record<string, unknown> | undefined;
        if (referrerJourney?.referrer_url) {
          try {
            const url = new URL(String(referrerJourney.referrer_url));
            sourceText = url.hostname.replace('www.', '');
          } catch {
            sourceText = String(referrerJourney.referrer_url).slice(0, 30);
          }
        } else if (referrerJourney?.landing_page) {
          // Fallback to landing page from referrer_journey
          try {
            const url = new URL(String(referrerJourney.landing_page));
            sourceText = url.pathname.slice(0, 30) || '/';
          } catch {
            sourceText = String(referrerJourney.landing_page).slice(0, 30);
          }
        } else {
          // Legacy fallback for older data
          const referrer = metadata.referer_url || metadata.referrer_url;
          if (referrer) {
            try {
              const url = new URL(String(referrer));
              sourceText = url.hostname.replace('www.', '');
            } catch {
              sourceText = String(referrer).slice(0, 30);
            }
          }
        }
      }
      
      return (
        <span className="truncate block" title={sourceText !== '-' ? sourceText : undefined}>
          {sourceText}
        </span>
      );
    },
  },
  {
    id: 'assignees',
    size: 140,
    minSize: 100,
    maxSize: 180,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Assignees" />
    ),
    cell: ({ row }) => (
      <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
        <LeadAssigneePicker
          leadId={row.original.id}
          assignees={getAssignees(row.original.id)}
          onAdd={(userId) => onAddAssignee?.(row.original.id, userId)}
          onRemove={(userId) => onRemoveAssignee?.(row.original.id, userId)}
          size="sm"
          disabled={!onAddAssignee}
        />
      </div>
    ),
  },
  {
    accessorKey: 'created_at',
    size: 120,
    minSize: 100,
    maxSize: 140,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) =>
      formatShortTime(new Date(row.original.created_at)),
  },
  {
    accessorKey: 'updated_at',
    size: 120,
    minSize: 100,
    maxSize: 140,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Updated" />
    ),
    cell: ({ row }) =>
      formatShortTime(new Date(row.original.updated_at)),
  },
  // Actions column
  {
    id: 'actions',
    size: 80,
    minSize: 80,
    maxSize: 100,
    header: () => null,
    cell: ({ row }) => {
      const lead = row.original;
      
      // Quick actions shown on hover
      const quickActions: QuickAction[] = [
        {
          icon: Eye,
          label: 'View',
          onClick: (e) => { e.stopPropagation(); onView(lead); },
        },
      ];
      
      return (
        <RowActions
          quickActions={quickActions}
          menuContent={
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(lead); }}>
              <Eye size={14} className="mr-2" aria-hidden="true" />
              View details
            </DropdownMenuItem>
          }
        />
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];
