/**
 * AriLocationsSection
 * 
 * Locations management with TanStack Table, infinite scroll,
 * enhanced filters with chips, and collapsible WordPress integration.
 */

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, type SortingState, type RowSelectionState } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash01, XClose, X } from '@untitledui/icons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocations } from '@/hooks/useLocations';
import { useAgents } from '@/hooks/useAgents';
import { useConnectedAccounts } from '@/hooks/useConnectedAccounts';
import { CreateLocationDialog } from '@/components/agents/locations/CreateLocationDialog';
import { LocationDetailsSheet } from '@/components/agents/locations/LocationDetailsSheet';
import { WordPressIntegrationSection } from '@/components/agents/locations/WordPressIntegrationSection';
import { AriSectionHeader } from './AriSectionHeader';
import { LoadingState } from '@/components/ui/loading-state';
import { SimpleDeleteDialog } from '@/components/ui/simple-delete-dialog';
import { DataTable } from '@/components/data-table/DataTable';
import { DataTableToolbar } from '@/components/data-table/DataTableToolbar';
import { createLocationsColumns, type LocationWithCounts } from '@/components/data-table/columns';
import { EmptyState } from '@/components/ui/empty-state';
import { MarkerPin01 } from '@untitledui/icons';
import { toast } from 'sonner';

interface AriLocationsSectionProps {
  agentId: string;
  userId: string;
}

interface ActiveFilter {
  type: 'calendar' | 'wordpress' | 'state';
  value: string;
  label: string;
}

export const AriLocationsSection: React.FC<AriLocationsSectionProps> = ({ agentId, userId }) => {
  const { locations, loading, createLocation, updateLocation, deleteLocation, refetch } = useLocations(agentId);
  const { agents, refetch: refetchAgents } = useAgents();
  const { accounts } = useConnectedAccounts(undefined, agentId);
  
  const agent = agents.find(a => a.id === agentId) || null;

  // Combined refetch for WordPress sync operations - refreshes both locations and agent config
  const handleWordPressSyncComplete = useCallback(() => {
    refetch();
    refetchAgents();
  }, [refetch, refetchAgents]);
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationWithCounts | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteLocation_, setDeleteLocation] = useState<LocationWithCounts | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  
  // Filter states
  const [calendarFilter, setCalendarFilter] = useState<string>('all');
  const [wordpressFilter, setWordpressFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');

  // Infinite scroll state
  const [displayCount, setDisplayCount] = useState(20);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Enrich locations with calendar counts
  const locationsWithCounts: LocationWithCounts[] = useMemo(() => {
    return locations.map(location => ({
      ...location,
      calendarCount: accounts.filter(a => a.location_id === location.id).length,
    }));
  }, [locations, accounts]);

  // Get unique states for filter
  const uniqueStates = useMemo(() => {
    const states = new Set<string>();
    locationsWithCounts.forEach(loc => {
      if (loc.state) states.add(loc.state);
    });
    return Array.from(states).sort();
  }, [locationsWithCounts]);

  // Apply filters
  const filteredLocations = useMemo(() => {
    return locationsWithCounts.filter(location => {
      // Calendar filter
      if (calendarFilter === 'connected' && location.calendarCount === 0) return false;
      if (calendarFilter === 'none' && location.calendarCount > 0) return false;
      
      // WordPress filter
      const hasWordPress = location.wordpress_community_id || location.wordpress_slug;
      if (wordpressFilter === 'connected' && !hasWordPress) return false;
      if (wordpressFilter === 'none' && hasWordPress) return false;
      
      // State filter
      if (stateFilter !== 'all' && location.state !== stateFilter) return false;
      
      return true;
    });
  }, [locationsWithCounts, calendarFilter, wordpressFilter, stateFilter]);

  // Active filters for chips
  const activeFilters: ActiveFilter[] = useMemo(() => {
    const filters: ActiveFilter[] = [];
    if (calendarFilter !== 'all') {
      filters.push({
        type: 'calendar',
        value: calendarFilter,
        label: calendarFilter === 'connected' ? 'Has Calendar' : 'No Calendar',
      });
    }
    if (wordpressFilter !== 'all') {
      filters.push({
        type: 'wordpress',
        value: wordpressFilter,
        label: wordpressFilter === 'connected' ? 'WordPress Connected' : 'No WordPress',
      });
    }
    if (stateFilter !== 'all') {
      filters.push({
        type: 'state',
        value: stateFilter,
        label: stateFilter,
      });
    }
    return filters;
  }, [calendarFilter, wordpressFilter, stateFilter]);

  const clearFilter = (type: 'calendar' | 'wordpress' | 'state') => {
    if (type === 'calendar') setCalendarFilter('all');
    if (type === 'wordpress') setWordpressFilter('all');
    if (type === 'state') setStateFilter('all');
  };

  const clearAllFilters = () => {
    setCalendarFilter('all');
    setWordpressFilter('all');
    setStateFilter('all');
  };

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayCount < filteredLocations.length) {
          setDisplayCount(prev => Math.min(prev + 20, filteredLocations.length));
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [filteredLocations.length, displayCount]);

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(20);
  }, [calendarFilter, wordpressFilter, stateFilter, globalFilter]);

  // CRITICAL: Memoize to prevent new array reference on every render
  const displayedLocations = useMemo(
    () => filteredLocations.slice(0, displayCount),
    [filteredLocations, displayCount]
  );

  const handleCreate = async (data: Parameters<typeof createLocation>[0]) => {
    const id = await createLocation(data, userId);
    if (id) {
      setCreateDialogOpen(false);
      // Open the new location in the sheet
      const newLocation = locationsWithCounts.find(l => l.id === id);
      if (newLocation) {
        setSelectedLocation(newLocation);
        setSheetOpen(true);
      }
    }
  };

  const handleView = useCallback((location: LocationWithCounts) => {
    setSelectedLocation(location);
    setSheetOpen(true);
  }, []);

  const handleDelete = async () => {
    if (!deleteLocation_) return;
    await deleteLocation(deleteLocation_.id);
    setDeleteLocation(null);
    if (selectedLocation?.id === deleteLocation_.id) {
      setSheetOpen(false);
      setSelectedLocation(null);
    }
  };

  const handleBulkDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) return;
    
    const count = selectedRows.length;
    const promises = selectedRows.map(row => deleteLocation(row.original.id));
    
    await Promise.all(promises);
    setRowSelection({});
    toast.success(`Deleted ${count} location${count > 1 ? 's' : ''}`);
  };

  const clearSelection = () => {
    setRowSelection({});
  };

  // Stabilize onDelete callback
  const handleSetDeleteLocation = useCallback((location: LocationWithCounts) => {
    setDeleteLocation(location);
  }, []);

  const columns = useMemo(() => createLocationsColumns({
    onView: handleView,
    onDelete: handleSetDeleteLocation,
  }), [handleView, handleSetDeleteLocation]);

  const table = useReactTable({
    data: displayedLocations,
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

  if (loading) {
    return <LoadingState text="Loading locations..." />;
  }

  return (
    <div>
      <AriSectionHeader
        title="Locations"
        description="Manage communities, connect calendars, and configure business hours"
        extra={
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            Add Location
          </Button>
        }
      />

      <div className="space-y-4">
        {/* WordPress Integration - Collapsible */}
        <WordPressIntegrationSection agent={agent} onSyncComplete={handleWordPressSyncComplete} />

        {/* Bulk Actions Bar */}
        {selectedCount > 0 && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg border">
            <span className="text-sm">
              {selectedCount} location{selectedCount > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                <XClose size={14} className="mr-1.5" />
                Clear
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash01 size={14} className="mr-1.5" />
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Locations Table */}
        {locationsWithCounts.length === 0 ? (
          <EmptyState
            icon={<MarkerPin01 className="h-5 w-5 text-muted-foreground/50" />}
            title="No locations yet"
            description="Add locations to organize your business"
            action={
              <Button onClick={() => setCreateDialogOpen(true)} size="sm">
                Add Location
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            <DataTableToolbar
              table={table}
              searchPlaceholder="Search locations..."
              globalFilter
            >
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger className="w-[120px] h-8">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {uniqueStates.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={calendarFilter} onValueChange={setCalendarFilter}>
                <SelectTrigger className="w-[130px] h-8">
                  <SelectValue placeholder="Calendars" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Calendars</SelectItem>
                  <SelectItem value="connected">Connected</SelectItem>
                  <SelectItem value="none">No Calendars</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={wordpressFilter} onValueChange={setWordpressFilter}>
                <SelectTrigger className="w-[130px] h-8">
                  <SelectValue placeholder="WordPress" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All WordPress</SelectItem>
                  <SelectItem value="connected">Connected</SelectItem>
                  <SelectItem value="none">Not Connected</SelectItem>
                </SelectContent>
              </Select>
            </DataTableToolbar>

            {/* Active Filter Chips */}
            {activeFilters.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {activeFilters.map(filter => (
                  <Badge
                    key={`${filter.type}-${filter.value}`}
                    variant="secondary"
                    className="pl-2 pr-1 py-1 gap-1 cursor-pointer hover:bg-secondary/80"
                    onClick={() => clearFilter(filter.type)}
                  >
                    {filter.label}
                    <X className="h-3 w-3" />
                  </Badge>
                ))}
                {activeFilters.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground"
                    onClick={clearAllFilters}
                  >
                    Clear all
                  </Button>
                )}
              </div>
            )}

            <DataTable
              table={table}
              columns={columns}
              onRowClick={(row) => handleView(row)}
            />

            {/* Infinite scroll trigger */}
            {displayCount < filteredLocations.length && (
              <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
                <span className="text-sm text-muted-foreground">
                  Loading more...
                </span>
              </div>
            )}

            {/* Results count */}
            <p className="text-xs text-muted-foreground text-center">
              Showing {displayedLocations.length} of {filteredLocations.length} locations
            </p>
          </div>
        )}

        <CreateLocationDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onCreate={handleCreate}
        />

        <LocationDetailsSheet
          location={selectedLocation}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          agentId={agentId}
          onUpdate={updateLocation}
        />

        <SimpleDeleteDialog
          open={!!deleteLocation_}
          onOpenChange={(open) => !open && setDeleteLocation(null)}
          onConfirm={handleDelete}
          title="Delete Location"
          description="This will permanently delete this location."
        />
      </div>
    </div>
  );
};
