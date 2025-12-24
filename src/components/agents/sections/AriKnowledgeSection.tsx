/**
 * AriKnowledgeSection
 * 
 * Knowledge sources management with TanStack Table, filters, filter chips,
 * infinite scroll, and click-to-open details sheet.
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  getSortedRowModel, 
  getFilteredRowModel, 
  type SortingState, 
  type RowSelectionState 
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Database01, Trash01, XClose, X, FilterLines } from '@untitledui/icons';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useKnowledgeSources } from '@/hooks/useKnowledgeSources';
import { useLocations } from '@/hooks/useLocations';
import { AddKnowledgeDialog } from '@/components/agents/AddKnowledgeDialog';
import { KnowledgeDetailsSheet } from '@/components/agents/knowledge';
import { AriSectionHeader } from './AriSectionHeader';
import { LoadingState } from '@/components/ui/loading-state';
import { ZapSolidIcon } from '@/components/ui/zap-solid-icon';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/types/errors';
import { DataTable } from '@/components/data-table/DataTable';
import { DataTableToolbar } from '@/components/data-table/DataTableToolbar';
import { createKnowledgeColumns, type KnowledgeSourceWithMeta } from '@/components/data-table/columns';
import { SimpleDeleteDialog } from '@/components/ui/simple-delete-dialog';
import type { KnowledgeSourceMetadata } from '@/types/metadata';

interface AriKnowledgeSectionProps {
  agentId: string;
  userId: string;
}

interface ActiveFilter {
  type: 'sourceType' | 'status' | 'location';
  value: string;
  label: string;
}

// Type labels for display
const TYPE_LABELS: Record<string, string> = {
  url: 'URL',
  pdf: 'PDF',
  api: 'API',
  json: 'JSON',
  xml: 'XML',
  csv: 'CSV',
};

// Status labels for display
const STATUS_LABELS: Record<string, string> = {
  ready: 'Ready',
  processing: 'Processing',
  pending: 'Pending',
  error: 'Error',
};

const AriKnowledgeSectionComponent: React.FC<AriKnowledgeSectionProps> = ({ agentId, userId }) => {
  const { 
    sources, 
    loading, 
    deleteSource, 
    deleteChildSource, 
    reprocessSource, 
    resumeProcessing, 
    retryChildSource, 
    retrainAllSources, 
    triggerManualRefresh, 
    isSourceOutdated, 
    getChildSources, 
    getParentSources 
  } = useKnowledgeSources(agentId);
  
  const { locations } = useLocations(agentId);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainProgress, setRetrainProgress] = useState({ completed: 0, total: 0 });
  
  // Sheet state
  const [selectedSource, setSelectedSource] = useState<KnowledgeSourceWithMeta | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  
  // Delete confirmation state
  const [deleteSource_, setDeleteSource] = useState<KnowledgeSourceWithMeta | null>(null);
  
  // Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Filter states
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState<string[]>([]);

  // Infinite scroll state
  const [displayCount, setDisplayCount] = useState(20);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Memoize parent sources to prevent infinite re-renders
  const parentSources = useMemo(() => {
    return getParentSources().filter(source => source.source_type !== 'wordpress_home');
  }, [getParentSources]);
  
  const outdatedCount = useMemo(() => {
    return parentSources.filter(isSourceOutdated).length;
  }, [parentSources, isSourceOutdated]);

  // Transform parent sources to KnowledgeSourceWithMeta with computed fields
  const sourcesWithMeta: KnowledgeSourceWithMeta[] = useMemo(() => {
    return parentSources.map(source => {
      const metadata = (source.metadata || {}) as KnowledgeSourceMetadata;
      const childSources = getChildSources(source.id);
      const locationId = source.default_location_id;
      const location = locationId ? locations.find(l => l.id === locationId) : null;
      
      return {
        ...source,
        childCount: childSources.length,
        chunkCount: metadata.chunks_count ?? 0,
        locationName: location?.name,
      };
    });
  }, [parentSources, getChildSources, locations]);

  // Get unique types for filter
  const uniqueTypes = useMemo(() => {
    const types = new Set<string>();
    sourcesWithMeta.forEach(s => {
      if (s.type) types.add(s.type);
    });
    return Array.from(types).sort();
  }, [sourcesWithMeta]);

  // Get unique statuses for filter
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set<string>();
    sourcesWithMeta.forEach(s => {
      if (s.status) statuses.add(s.status);
    });
    return Array.from(statuses).sort();
  }, [sourcesWithMeta]);

  // Get unique locations for filter
  const uniqueLocations = useMemo(() => {
    const locs = new Map<string, string>();
    sourcesWithMeta.forEach(s => {
      if (s.default_location_id && s.locationName) {
        locs.set(s.default_location_id, s.locationName);
      }
    });
    return Array.from(locs.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [sourcesWithMeta]);

  // Apply filters
  const filteredSources = useMemo(() => {
    return sourcesWithMeta.filter(source => {
      // Type filter (multi-select)
      if (typeFilter.length > 0 && (!source.type || !typeFilter.includes(source.type))) {
        return false;
      }
      // Status filter (multi-select)
      if (statusFilter.length > 0 && (!source.status || !statusFilter.includes(source.status))) {
        return false;
      }
      // Location filter (multi-select)
      if (locationFilter.length > 0 && (!source.default_location_id || !locationFilter.includes(source.default_location_id))) {
        return false;
      }
      return true;
    });
  }, [sourcesWithMeta, typeFilter, statusFilter, locationFilter]);

  // Active filters for chips
  const activeFilters: ActiveFilter[] = useMemo(() => {
    const filters: ActiveFilter[] = [];
    typeFilter.forEach(type => {
      filters.push({
        type: 'sourceType',
        value: type,
        label: TYPE_LABELS[type] || type,
      });
    });
    statusFilter.forEach(status => {
      filters.push({
        type: 'status',
        value: status,
        label: STATUS_LABELS[status] || status,
      });
    });
    locationFilter.forEach(locId => {
      const loc = uniqueLocations.find(l => l.id === locId);
      filters.push({
        type: 'location',
        value: locId,
        label: loc?.name || locId,
      });
    });
    return filters;
  }, [typeFilter, statusFilter, locationFilter, uniqueLocations]);

  const clearFilter = (type: ActiveFilter['type'], value: string) => {
    if (type === 'sourceType') setTypeFilter(prev => prev.filter(v => v !== value));
    if (type === 'status') setStatusFilter(prev => prev.filter(v => v !== value));
    if (type === 'location') setLocationFilter(prev => prev.filter(v => v !== value));
  };

  const clearAllFilters = () => {
    setTypeFilter([]);
    setStatusFilter([]);
    setLocationFilter([]);
  };

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayCount < filteredSources.length) {
          setDisplayCount(prev => Math.min(prev + 20, filteredSources.length));
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [filteredSources.length, displayCount]);

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(20);
  }, [typeFilter, statusFilter, locationFilter, globalFilter]);

  // Displayed sources with pagination
  const displayedSources = useMemo(
    () => filteredSources.slice(0, displayCount),
    [filteredSources, displayCount]
  );

  // Handler to view source details
  const handleViewSource = useCallback((source: KnowledgeSourceWithMeta) => {
    setSelectedSource(source);
    setSheetOpen(true);
  }, []);

  // Handler for delete button in table
  const handleSetDeleteSource = useCallback((source: KnowledgeSourceWithMeta) => {
    setDeleteSource(source);
  }, []);

  // Handler for reprocess in table
  const handleReprocessSource = useCallback(async (source: KnowledgeSourceWithMeta) => {
    await reprocessSource(source.id);
  }, [reprocessSource]);

  // Check if source is outdated
  const checkIsOutdated = useCallback((source: KnowledgeSourceWithMeta) => {
    return isSourceOutdated(source);
  }, [isSourceOutdated]);

  // Create table columns
  const columns = useMemo(() => createKnowledgeColumns({
    onView: handleViewSource,
    onDelete: handleSetDeleteSource,
    onReprocess: handleReprocessSource,
    isOutdated: checkIsOutdated,
  }), [handleViewSource, handleSetDeleteSource, handleReprocessSource, checkIsOutdated]);

  // Create table instance
  const table = useReactTable({
    data: displayedSources,
    columns,
    state: {
      sorting,
      globalFilter,
      rowSelection,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
  });

  const selectedCount = Object.keys(rowSelection).length;

  const handleRetrainAll = async () => {
    setIsRetraining(true);
    setRetrainProgress({ completed: 0, total: sources.filter(s => s.status !== 'processing').length });
    
    try {
      const { success, failed } = await retrainAllSources((completed, total) => {
        setRetrainProgress({ completed, total });
      });

      if (failed === 0) {
        toast.success('Retraining complete', {
          description: `Successfully retrained ${success} knowledge sources.`,
        });
      } else {
        toast.warning('Retraining completed with errors', {
          description: `${success} succeeded, ${failed} failed.`,
        });
      }
    } catch (error: unknown) {
      toast.error('Retraining failed', { description: getErrorMessage(error) });
    } finally {
      setIsRetraining(false);
      setRetrainProgress({ completed: 0, total: 0 });
    }
  };

  // Handle row click to open details sheet
  const handleRowClick = (source: KnowledgeSourceWithMeta) => {
    setSelectedSource(source);
    setSheetOpen(true);
  };

  // Handle delete from sheet
  const handleDeleteFromSheet = async (id: string) => {
    await deleteSource(id);
    setSheetOpen(false);
    setSelectedSource(null);
  };

  // Handle reprocess from sheet
  const handleReprocessFromSheet = async (id: string) => {
    await reprocessSource(id);
  };

  // Handle refresh from sheet
  const handleRefreshFromSheet = async (id: string) => {
    await triggerManualRefresh(id);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deleteSource_) return;
    await deleteSource(deleteSource_.id);
    setDeleteSource(null);
    // Clear selection if deleted source was selected
    if (selectedSource?.id === deleteSource_.id) {
      setSheetOpen(false);
      setSelectedSource(null);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) return;
    
    const count = selectedRows.length;
    const promises = selectedRows.map(row => deleteSource(row.original.id));
    
    await Promise.all(promises);
    setRowSelection({});
    toast.success(`Deleted ${count} source${count > 1 ? 's' : ''}`);
  };

  // Clear selection
  const clearSelection = () => {
    setRowSelection({});
  };

  if (loading) {
    return <LoadingState text="Loading knowledge sources..." />;
  }

  // Filter Popover
  const FilterPopover = (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-1.5">
          <FilterLines size={16} />
          Filters
          {activeFilters.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {activeFilters.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="end">
        <div className="space-y-4">
          {/* Type Filter */}
          {uniqueTypes.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase">Type</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {uniqueTypes.map(type => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={typeFilter.includes(type)}
                      onCheckedChange={(checked) => {
                        setTypeFilter(prev => 
                          checked 
                            ? [...prev, type]
                            : prev.filter(t => t !== type)
                        );
                      }}
                    />
                    <Label htmlFor={`type-${type}`} className="text-sm font-normal cursor-pointer">
                      {TYPE_LABELS[type] || type}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uniqueTypes.length > 0 && uniqueStatuses.length > 0 && <Separator />}

          {/* Status Filter */}
          {uniqueStatuses.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase">Status</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {uniqueStatuses.map(status => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={statusFilter.includes(status)}
                      onCheckedChange={(checked) => {
                        setStatusFilter(prev => 
                          checked 
                            ? [...prev, status]
                            : prev.filter(s => s !== status)
                        );
                      }}
                    />
                    <Label htmlFor={`status-${status}`} className="text-sm font-normal cursor-pointer">
                      {STATUS_LABELS[status] || status}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uniqueLocations.length > 0 && (uniqueTypes.length > 0 || uniqueStatuses.length > 0) && <Separator />}

          {/* Location Filter */}
          {uniqueLocations.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase">Location</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {uniqueLocations.map(loc => (
                  <div key={loc.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`loc-${loc.id}`}
                      checked={locationFilter.includes(loc.id)}
                      onCheckedChange={(checked) => {
                        setLocationFilter(prev => 
                          checked 
                            ? [...prev, loc.id]
                            : prev.filter(l => l !== loc.id)
                        );
                      }}
                    />
                    <Label htmlFor={`loc-${loc.id}`} className="text-sm font-normal cursor-pointer truncate">
                      {loc.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeFilters.length > 0 && (
            <>
              <Separator />
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={clearAllFilters}
              >
                Clear all filters
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );

  return (
    <div>
      <AriSectionHeader
        title="Knowledge"
        description="Add URLs, sitemaps, or documents to train Ari"
        extra={
          <div className="flex items-center gap-2">
            {sources.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRetrainAll}
                disabled={isRetraining || sources.every(s => s.status === 'processing')}
              >
                <ZapSolidIcon size={16} className={`mr-1.5 text-orange-500 ${isRetraining ? 'animate-pulse' : ''}`} />
                {isRetraining 
                  ? `${retrainProgress.completed}/${retrainProgress.total}`
                  : outdatedCount > 0 
                    ? `Retrain (${outdatedCount})`
                    : 'Retrain'
                }
              </Button>
            )}
            <Button size="sm" onClick={() => setAddDialogOpen(true)}>
              Add Source
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        {sourcesWithMeta.length === 0 ? (
          <EmptyState
            icon={<Database01 className="h-5 w-5 text-muted-foreground/50" />}
            title="No knowledge sources yet"
            description="Add documents, URLs, or sitemaps to enhance Ari's knowledge"
            action={<Button onClick={() => setAddDialogOpen(true)} size="sm">Add Your First Source</Button>}
          />
        ) : (
          <>
            {/* Bulk selection action bar */}
            {selectedCount > 0 && (
              <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2">
                <span className="text-sm text-muted-foreground">
                  {selectedCount} source{selectedCount > 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="h-8 gap-1.5"
                  >
                    <XClose className="h-4 w-4" />
                    Clear
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="h-8 gap-1.5"
                  >
                    <Trash01 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            )}

            {/* DataTable with toolbar and filters */}
            <div className="flex items-center justify-between gap-2">
              <DataTableToolbar
                table={table}
                searchPlaceholder="Search sources..."
                globalFilter
              />
              {FilterPopover}
            </div>

            {/* Active filter chips */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {activeFilters.map((filter, index) => (
                  <Badge
                    key={`${filter.type}-${filter.value}-${index}`}
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
                    {filter.label}
                    <button
                      onClick={() => clearFilter(filter.type, filter.value)}
                      className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                    >
                      <X size={12} />
                    </button>
                  </Badge>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-6 px-2 text-xs"
                >
                  Clear all
                </Button>
              </div>
            )}
            
            <DataTable
              table={table}
              columns={columns}
              onRowClick={handleRowClick}
              emptyMessage="No knowledge sources found."
            />

            {/* Infinite scroll trigger */}
            {displayCount < filteredSources.length && (
              <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
                <span className="text-sm text-muted-foreground">Loading more...</span>
              </div>
            )}
          </>
        )}

        <AddKnowledgeDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          agentId={agentId}
          userId={userId}
        />

        {/* Knowledge Details Sheet */}
        <KnowledgeDetailsSheet
          source={selectedSource}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onDelete={handleDeleteFromSheet}
          onReprocess={handleReprocessFromSheet}
          onRefreshNow={handleRefreshFromSheet}
          onRetryChild={retryChildSource}
          onDeleteChild={deleteChildSource}
          isOutdated={selectedSource ? isSourceOutdated(selectedSource) : false}
          childSources={selectedSource ? getChildSources(selectedSource.id) : []}
          locationName={selectedSource?.locationName}
        />

        {/* Delete confirmation dialog */}
        <SimpleDeleteDialog
          open={!!deleteSource_}
          onOpenChange={(open) => !open && setDeleteSource(null)}
          title="Delete Knowledge Source"
          description="Are you sure you want to delete this knowledge source? This action cannot be undone."
          onConfirm={handleDeleteConfirm}
        />
      </div>
    </div>
  );
};

/**
 * Memoized AriKnowledgeSection to prevent unnecessary re-renders.
 * Only re-renders when agentId or userId props change.
 */
export const AriKnowledgeSection = React.memo(AriKnowledgeSectionComponent);