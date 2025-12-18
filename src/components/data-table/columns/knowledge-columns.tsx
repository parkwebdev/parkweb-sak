/**
 * Knowledge Sources Table Columns
 * 
 * Column definitions for the knowledge sources data table.
 * Follows the same patterns as locations-columns.tsx for consistency.
 */

import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  File06, Link03, Database01, Trash01, RefreshCcw01, CheckCircle, XCircle, 
  Clock, Globe01, Building07, AlertCircle 
} from '@untitledui/icons';
import { DataTableColumnHeader } from '../DataTableColumnHeader';
import { formatDistanceToNow } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';
import type { KnowledgeSourceMetadata, RefreshStrategy, KnowledgeSourceType } from '@/types/metadata';
import { REFRESH_STRATEGY_LABELS, SOURCE_TYPE_LABELS } from '@/types/metadata';

// Base knowledge source type from database
type KnowledgeSource = Tables<'knowledge_sources'>;

/**
 * Extended knowledge source type with computed/joined fields.
 * Note: source_type, refresh_strategy, last_fetched_at, next_refresh_at 
 * already exist on the base type from the database schema.
 */
export interface KnowledgeSourceWithMeta extends KnowledgeSource {
  /** Number of child sources (for sitemaps) */
  childCount?: number;
  /** Number of chunks indexed */
  chunkCount?: number;
  /** Associated property count (for property sources) */
  propertyCount?: number;
  /** Associated location name */
  locationName?: string;
}

/**
 * Props for creating knowledge columns
 */
export interface KnowledgeColumnsProps {
  /** Handler when row is clicked to view details */
  onView: (source: KnowledgeSourceWithMeta) => void;
  /** Handler for deleting a source */
  onDelete: (source: KnowledgeSourceWithMeta) => void;
  /** Handler for reprocessing a source */
  onReprocess: (source: KnowledgeSourceWithMeta) => void;
  /** Function to check if a source is outdated */
  isOutdated: (source: KnowledgeSourceWithMeta) => boolean;
}

/**
 * Type icons mapping
 */
const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  pdf: File06,
  url: Link03,
  api: Database01,
  json: Database01,
  xml: Database01,
  csv: Database01,
};

/**
 * Status badge variants
 */
const statusVariants: Record<string, 'default' | 'secondary' | 'destructive'> = {
  ready: 'default',
  processing: 'secondary',
  pending: 'secondary',
  error: 'destructive',
};

/**
 * Status icons mapping
 */
const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  ready: CheckCircle,
  processing: Clock,
  pending: Clock,
  error: XCircle,
};

/**
 * Get display name for a knowledge source
 */
const getDisplayName = (source: KnowledgeSourceWithMeta): string => {
  const metadata = (source.metadata || {}) as KnowledgeSourceMetadata;
  const sourceType = source.source_type || (metadata.is_sitemap ? 'sitemap' : 'url');
  
  // WordPress sources
  if (sourceType === 'wordpress_home') {
    return source.source.replace('WordPress: ', 'WordPress Homes: ');
  }
  
  // Property listings
  if (sourceType === 'property_listings' || sourceType === 'property_feed') {
    try {
      return `Properties: ${new URL(source.source).hostname}`;
    } catch {
      return source.source;
    }
  }
  
  // Sitemaps
  if (sourceType === 'sitemap' || metadata.is_sitemap) {
    try {
      return `Sitemap: ${new URL(source.source).hostname}`;
    } catch {
      return source.source;
    }
  }
  
  // Regular URLs - show hostname
  try {
    const url = new URL(source.source);
    return url.hostname + (url.pathname !== '/' ? url.pathname : '');
  } catch {
    return source.source;
  }
};

/**
 * Get the appropriate icon for a source
 */
const getSourceIcon = (source: KnowledgeSourceWithMeta): React.ComponentType<{ className?: string }> => {
  const metadata = (source.metadata || {}) as KnowledgeSourceMetadata;
  const sourceType = source.source_type || (metadata.is_sitemap ? 'sitemap' : 'url');
  
  if (sourceType === 'wordpress_home' || sourceType === 'property_listings' || sourceType === 'property_feed') {
    return Building07;
  }
  
  if (sourceType === 'sitemap' || metadata.is_sitemap) {
    return Globe01;
  }
  
  return typeIcons[source.type] || Link03;
};

/**
 * Get source type label
 */
const getSourceTypeLabel = (source: KnowledgeSourceWithMeta): string => {
  const metadata = (source.metadata || {}) as KnowledgeSourceMetadata;
  const sourceType = source.source_type || (metadata.is_sitemap ? 'sitemap' : 'url');
  
  return SOURCE_TYPE_LABELS[sourceType as KnowledgeSourceType] || 'URL';
};

/**
 * Get pages/chunks display text
 */
const getPagesOrChunks = (source: KnowledgeSourceWithMeta): string => {
  const metadata = (source.metadata || {}) as KnowledgeSourceMetadata;
  const sourceType = source.source_type || (metadata.is_sitemap ? 'sitemap' : 'url');
  
  // WordPress homes show property count
  if (sourceType === 'wordpress_home' && source.propertyCount !== undefined) {
    return `${source.propertyCount} homes`;
  }
  
  // Property listings show property count
  if ((sourceType === 'property_listings' || sourceType === 'property_feed') && source.propertyCount !== undefined) {
    return `${source.propertyCount} properties`;
  }
  
  // Sitemaps show page count
  if ((sourceType === 'sitemap' || metadata.is_sitemap) && source.childCount !== undefined) {
    return `${source.childCount} pages`;
  }
  
  // Regular sources show chunk count
  if (source.chunkCount !== undefined && source.chunkCount > 0) {
    return `${source.chunkCount} chunks`;
  }
  
  // Fallback to metadata chunks_count
  if (metadata.chunks_count !== undefined) {
    return `${metadata.chunks_count} chunks`;
  }
  
  return '-';
};

/**
 * Create knowledge source table columns
 */
export const createKnowledgeColumns = ({
  onView,
  onDelete,
  onReprocess,
  isOutdated,
}: KnowledgeColumnsProps): ColumnDef<KnowledgeSourceWithMeta>[] => [
  // Checkbox column for row selection
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
          aria-label={`Select ${getDisplayName(row.original)}`}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  
  // Source name with icon
  {
    id: 'source',
    accessorKey: 'source',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Source" />
    ),
    cell: ({ row }) => {
      const source = row.original;
      const Icon = getSourceIcon(source);
      const displayName = getDisplayName(source);
      const metadata = (source.metadata || {}) as KnowledgeSourceMetadata;
      const sourceType = source.source_type || (metadata.is_sitemap ? 'sitemap' : 'url');
      const isProperty = sourceType === 'wordpress_home' || sourceType === 'property_listings' || sourceType === 'property_feed';
      const isSitemap = sourceType === 'sitemap' || metadata.is_sitemap;
      
      return (
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-1.5 rounded-md shrink-0 ${isProperty || isSitemap ? 'bg-primary/10' : 'bg-accent'}`}>
            <Icon className={`h-4 w-4 ${isProperty || isSitemap ? 'text-primary' : 'text-accent-foreground'}`} />
          </div>
          <span className="font-medium truncate">{displayName}</span>
        </div>
      );
    },
  },
  
  // Type badge
  {
    id: 'type',
    header: () => <span>Type</span>,
    cell: ({ row }) => {
      const label = getSourceTypeLabel(row.original);
      return (
        <Badge variant="outline" className="text-xs whitespace-nowrap">
          {label}
        </Badge>
      );
    },
    enableSorting: false,
  },
  
  // Status with icon and outdated indicator
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const source = row.original;
      const status = source.status;
      const StatusIcon = statusIcons[status] || Clock;
      const variant = statusVariants[status] || 'secondary';
      const outdated = isOutdated(source);
      
      return (
        <div className="flex items-center gap-1.5">
          <Badge variant={variant} className="text-xs gap-1">
            <StatusIcon className="h-3 w-3" />
            <span className="capitalize">{status}</span>
          </Badge>
          {outdated && status === 'ready' && (
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="text-xs gap-1 border-warning text-warning">
                  <AlertCircle className="h-3 w-3" />
                  Outdated
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>This source needs to be reprocessed with the latest embedding model.</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      );
    },
  },
  
  // Refresh strategy
  {
    id: 'refresh',
    header: () => <span>Refresh</span>,
    cell: ({ row }) => {
      const strategy = row.original.refresh_strategy || 'manual';
      if (strategy === 'manual') {
        return <span className="text-muted-foreground text-sm">Manual</span>;
      }
      return (
        <span className="text-sm">{REFRESH_STRATEGY_LABELS[strategy] || strategy}</span>
      );
    },
    enableSorting: false,
  },
  
  // Pages/Chunks count
  {
    id: 'content',
    header: () => <span>Content</span>,
    cell: ({ row }) => {
      const text = getPagesOrChunks(row.original);
      if (text === '-') {
        return <span className="text-muted-foreground text-sm">-</span>;
      }
      return <span className="text-sm">{text}</span>;
    },
    enableSorting: false,
  },
  
  // Date added
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Added" />
    ),
    cell: ({ row }) => {
      const date = row.original.created_at;
      if (!date) return <span className="text-muted-foreground">-</span>;
      return (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(date), { addSuffix: true })}
        </span>
      );
    },
  },
  
  // Actions column
  {
    id: 'actions',
    header: () => <span>Actions</span>,
    cell: ({ row }) => {
      const source = row.original;
      const isProcessing = source.status === 'processing' || source.status === 'pending';
      
      return (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReprocess(source)}
                disabled={isProcessing}
                className="h-8 w-8 p-0"
              >
                <RefreshCcw01 className={`h-4 w-4 text-muted-foreground hover:text-foreground ${isProcessing ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isProcessing ? 'Processing...' : 'Reprocess'}</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(source)}
                className="h-8 w-8 p-0"
              >
                <Trash01 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete</p>
            </TooltipContent>
          </Tooltip>
        </div>
      );
    },
  },
];
