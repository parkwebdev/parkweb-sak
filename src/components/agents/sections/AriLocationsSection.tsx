/**
 * AriLocationsSection
 * 
 * Locations/Properties management with TanStack Table, infinite scroll,
 * enhanced filters with chips, and collapsible WordPress integration.
 * Toggle between Communities and Properties views.
 */

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, type SortingState, type RowSelectionState } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash01, XClose, X, FilterLines, AlertTriangle, Home01 } from '@untitledui/icons';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useLocations } from '@/hooks/useLocations';
import { useProperties } from '@/hooks/useProperties';
import { useAgent } from '@/hooks/useAgent';
import { useConnectedAccounts } from '@/hooks/useConnectedAccounts';
import { CreateLocationDialog } from '@/components/agents/locations/CreateLocationDialog';
import { LocationDetailsSheet } from '@/components/agents/locations/LocationDetailsSheet';
import { WordPressIntegrationSection } from '@/components/agents/locations/WordPressIntegrationSection';
import { AriSectionHeader } from './AriSectionHeader';
import { SkeletonTableSection } from '@/components/ui/skeleton';
import { SimpleDeleteDialog } from '@/components/ui/simple-delete-dialog';
import { DataTable } from '@/components/data-table/DataTable';
import { DataTableToolbar } from '@/components/data-table/DataTableToolbar';
import { createLocationsColumns, type LocationWithCounts, createPropertiesColumns, type PropertyWithLocation } from '@/components/data-table/columns';
import { EmptyState } from '@/components/ui/empty-state';
import { MarkerPin01 } from '@untitledui/icons';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';

interface AriLocationsSectionProps {
  agentId: string;
  userId: string;
}

interface ActiveFilter {
  type: 'calendar' | 'wordpress' | 'state' | 'community' | 'status' | 'validation';
  value: string;
  label: string;
}

type ViewMode = 'communities' | 'properties';

export function AriLocationsSection({ agentId, userId }: AriLocationsSectionProps) {
  const { locations, loading: locationsLoading, createLocation, updateLocation, deleteLocation, refetch } = useLocations(agentId);
  const { propertiesWithLocation, loading: propertiesLoading, validationStats, uniqueLocations, locationIdsByName, refetch: refetchProperties } = useProperties(agentId);
  const { agent, refetch: refetchAgent } = useAgent();
  const { accounts } = useConnectedAccounts(undefined, agentId);

  // View mode toggle
  const [viewMode, setViewMode] = useState<ViewMode>('communities');
  const loading = viewMode === 'communities' ? locationsLoading : propertiesLoading;

  // Combined refetch for WordPress sync operations
  const handleWordPressSyncComplete = useCallback(() => {
    refetch();
    refetchAgent();
    refetchProperties();
  }, [refetch, refetchAgent, refetchProperties]);
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationWithCounts | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteLocation_, setDeleteLocation] = useState<LocationWithCounts | null>(null);
  const [deleteProperty_, setDeleteProperty] = useState<PropertyWithLocation | null>(null);
  
  // Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  
  // Location filters
  const [calendarFilter, setCalendarFilter] = useState<string>('all');
  const [wordpressFilter, setWordpressFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string[]>([]);

  // Property filters
  const [communityFilter, setCommunityFilter] = useState<string[]>([]);
  const [propertyStatusFilter, setPropertyStatusFilter] = useState<string[]>([]);
  const [validationFilter, setValidationFilter] = useState<string>('all');

  // Infinite scroll state
  const [displayCount, setDisplayCount] = useState(20);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Reset filters when switching view modes
  useEffect(() => {
    setGlobalFilter('');
    setRowSelection({});
    setDisplayCount(20);
  }, [viewMode]);

  // Enrich locations with calendar counts
  const locationsWithCounts: LocationWithCounts[] = useMemo(() => {
    return locations.map(location => ({
      ...location,
      calendarCount: accounts.filter(a => a.location_id === location.id).length,
    }));
  }, [locations, accounts]);

  // Get unique states for location filter
  const uniqueStates = useMemo(() => {
    const states = new Set<string>();
    locationsWithCounts.forEach(loc => {
      if (loc.state) states.add(loc.state);
    });
    return Array.from(states).sort();
  }, [locationsWithCounts]);

  // Apply location filters
  const filteredLocations = useMemo(() => {
    return locationsWithCounts.filter(location => {
      if (calendarFilter === 'connected' && location.calendarCount === 0) return false;
      if (calendarFilter === 'none' && location.calendarCount > 0) return false;
      
      const hasWordPress = location.wordpress_community_id || location.wordpress_slug;
      if (wordpressFilter === 'connected' && !hasWordPress) return false;
      if (wordpressFilter === 'none' && hasWordPress) return false;
      
      // Multi-select state filter
      if (stateFilter.length > 0 && (!location.state || !stateFilter.includes(location.state))) return false;
      
      return true;
    });
  }, [locationsWithCounts, calendarFilter, wordpressFilter, stateFilter]);

  // Apply property filters
  const filteredProperties = useMemo(() => {
    return propertiesWithLocation.filter(property => {
      // Multi-select community filter - check if location_id is in ANY of the selected community groups
      if (communityFilter.length > 0) {
        const allMatchingIds = communityFilter.flatMap(name => locationIdsByName.get(name) || []);
        if (!property.location_id || !allMatchingIds.includes(property.location_id)) {
          return false;
        }
      }
      
      // Multi-select status filter
      if (propertyStatusFilter.length > 0 && (!property.status || !propertyStatusFilter.includes(property.status))) return false;
      
      // Validation filter (stays single-select)
      if (validationFilter === 'missing_lot' && property.lot_number) return false;
      if (validationFilter === 'unmatched' && property.location_id) return false;
      
      return true;
    });
  }, [propertiesWithLocation, communityFilter, propertyStatusFilter, validationFilter, locationIdsByName]);

  // Active filters for chips - location view
  const activeLocationFilters: ActiveFilter[] = useMemo(() => {
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
    // Multi-select state chips
    stateFilter.forEach(state => {
      filters.push({
        type: 'state',
        value: state,
        label: state,
      });
    });
    return filters;
  }, [calendarFilter, wordpressFilter, stateFilter]);

  // Active filters for chips - property view
  const activePropertyFilters: ActiveFilter[] = useMemo(() => {
    const filters: ActiveFilter[] = [];
    // Multi-select community chips
    communityFilter.forEach(name => {
      const community = uniqueLocations.find(l => l.id === name);
      filters.push({
        type: 'community',
        value: name,
        label: community?.name || name,
      });
    });
    // Multi-select status chips
    propertyStatusFilter.forEach(status => {
      filters.push({
        type: 'status',
        value: status,
        label: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
      });
    });
    if (validationFilter !== 'all') {
      filters.push({
        type: 'validation',
        value: validationFilter,
        label: validationFilter === 'missing_lot' ? 'Missing Lot #' : 'Unmatched',
      });
    }
    return filters;
  }, [communityFilter, propertyStatusFilter, validationFilter, uniqueLocations]);

  const activeFilters = viewMode === 'communities' ? activeLocationFilters : activePropertyFilters;

  const clearFilter = (type: ActiveFilter['type'], value?: string) => {
    if (type === 'calendar') setCalendarFilter('all');
    if (type === 'wordpress') setWordpressFilter('all');
    if (type === 'state' && value) setStateFilter(prev => prev.filter(v => v !== value));
    if (type === 'community' && value) setCommunityFilter(prev => prev.filter(v => v !== value));
    if (type === 'status' && value) setPropertyStatusFilter(prev => prev.filter(v => v !== value));
    if (type === 'validation') setValidationFilter('all');
  };

  const clearAllFilters = () => {
    setCalendarFilter('all');
    setWordpressFilter('all');
    setStateFilter([]);
    setCommunityFilter([]);
    setPropertyStatusFilter([]);
    setValidationFilter('all');
  };

  // Infinite scroll observer
  useEffect(() => {
    const currentData = viewMode === 'communities' ? filteredLocations : filteredProperties;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayCount < currentData.length) {
          setDisplayCount(prev => Math.min(prev + 20, currentData.length));
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [filteredLocations.length, filteredProperties.length, displayCount, viewMode]);

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(20);
  }, [calendarFilter, wordpressFilter, stateFilter, communityFilter, propertyStatusFilter, validationFilter, globalFilter]);

  // Memoized displayed data
  const displayedLocations = useMemo(
    () => filteredLocations.slice(0, displayCount),
    [filteredLocations, displayCount]
  );

  const displayedProperties = useMemo(
    () => filteredProperties.slice(0, displayCount),
    [filteredProperties, displayCount]
  );

  const handleCreate = async (data: Parameters<typeof createLocation>[0]) => {
    const id = await createLocation(data, userId);
    if (id) {
      setCreateDialogOpen(false);
      const newLocation = locationsWithCounts.find(l => l.id === id);
      if (newLocation) {
        setSelectedLocation(newLocation);
        setSheetOpen(true);
      }
    }
  };

  const handleViewLocation = useCallback((location: LocationWithCounts) => {
    setSelectedLocation(location);
    setSheetOpen(true);
  }, []);

  const handleDeleteLocation = async () => {
    if (!deleteLocation_) return;
    await deleteLocation(deleteLocation_.id);
    setDeleteLocation(null);
    if (selectedLocation?.id === deleteLocation_.id) {
      setSheetOpen(false);
      setSelectedLocation(null);
    }
  };

  const handleDeleteProperty = async () => {
    if (!deleteProperty_) return;
    try {
      const { error } = await supabase.from('properties').delete().eq('id', deleteProperty_.id);
      if (error) throw error;
      toast.success('Property deleted');
      refetchProperties();
    } catch (error: unknown) {
      toast.error('Failed to delete property');
    } finally {
      setDeleteProperty(null);
    }
  };

  const handleBulkDeleteLocations = async () => {
    const selectedRows = locationsTable.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) return;
    
    const count = selectedRows.length;
    const promises = selectedRows.map(row => deleteLocation(row.original.id));
    
    await Promise.all(promises);
    setRowSelection({});
    toast.success(`Deleted ${count} location${count > 1 ? 's' : ''}`);
  };

  const handleBulkDeleteProperties = async () => {
    const selectedRows = propertiesTable.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) return;
    
    const count = selectedRows.length;
    const ids = selectedRows.map(row => row.original.id);
    
    const { error } = await supabase.from('properties').delete().in('id', ids);
    if (error) {
      toast.error('Failed to delete properties');
      return;
    }
    
    setRowSelection({});
    toast.success(`Deleted ${count} propert${count > 1 ? 'ies' : 'y'}`);
    refetchProperties();
  };

  const clearSelection = () => {
    setRowSelection({});
  };

  const handleSetDeleteLocation = useCallback((location: LocationWithCounts) => {
    setDeleteLocation(location);
  }, []);

  const handleSetDeleteProperty = useCallback((property: PropertyWithLocation) => {
    setDeleteProperty(property);
  }, []);

  // Location columns
  const locationColumns = useMemo(() => createLocationsColumns({
    onView: handleViewLocation,
    onDelete: handleSetDeleteLocation,
  }), [handleViewLocation, handleSetDeleteLocation]);

  // Property columns
  const propertyColumns = useMemo(() => createPropertiesColumns(), []);

  const locationsTable = useReactTable({
    data: displayedLocations,
    columns: locationColumns,
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

  const propertiesTable = useReactTable({
    data: displayedProperties,
    columns: propertyColumns,
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

  const table = viewMode === 'communities' ? locationsTable : propertiesTable;
  const selectedCount = Object.keys(rowSelection).length;

  if (loading) {
    return <SkeletonTableSection rows={5} />;
  }

  // View toggle component - same height as Filters button
  const ViewToggle = (
    <div className="flex items-center gap-1">
      <Button 
        variant={viewMode === 'communities' ? 'secondary' : 'ghost'}
        onClick={() => setViewMode('communities')}
        className={viewMode === 'communities' ? 'bg-muted hover:bg-muted/80' : ''}
      >
        Communities
        <Badge variant="outline" className="ml-1.5 h-5 px-1.5 text-xs">
          {locations.length}
        </Badge>
      </Button>
      <Button 
        variant={viewMode === 'properties' ? 'secondary' : 'ghost'}
        onClick={() => setViewMode('properties')}
        className={viewMode === 'properties' ? 'bg-muted hover:bg-muted/80' : ''}
      >
        Properties
        <Badge variant="outline" className="ml-1.5 h-5 px-1.5 text-xs">
          {propertiesWithLocation.length}
        </Badge>
      </Button>
    </div>
  );

  // Status options for property filter
  const statusOptions = [
    { value: 'available', label: 'Available' },
    { value: 'pending', label: 'Pending' },
    { value: 'sold', label: 'Sold' },
    { value: 'rented', label: 'Rented' },
    { value: 'coming_soon', label: 'Coming Soon' },
  ];

  // Shared filter popover content based on view mode
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
          {viewMode === 'communities' ? (
            <>
              {/* State - Multi-select checkboxes */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase">State</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {uniqueStates.map(state => (
                    <div key={state} className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        id={`state-${state}`}
                        checked={stateFilter.includes(state)}
                        onCheckedChange={(checked) => {
                          setStateFilter(prev => 
                            checked 
                              ? [...prev, state]
                              : prev.filter(s => s !== state)
                          );
                        }}
                      />
                      <Label htmlFor={`state-${state}`} className="text-sm font-normal cursor-pointer">
                        {state}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase">Calendar</Label>
                <RadioGroup value={calendarFilter} onValueChange={setCalendarFilter} className="gap-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="cal-all" />
                    <Label htmlFor="cal-all" className="text-sm font-normal cursor-pointer">All</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="connected" id="cal-connected" />
                    <Label htmlFor="cal-connected" className="text-sm font-normal cursor-pointer">Connected</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="cal-none" />
                    <Label htmlFor="cal-none" className="text-sm font-normal cursor-pointer">No Calendar</Label>
                  </div>
                </RadioGroup>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase">WordPress</Label>
                <RadioGroup value={wordpressFilter} onValueChange={setWordpressFilter} className="gap-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="wp-all" />
                    <Label htmlFor="wp-all" className="text-sm font-normal cursor-pointer">All</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="connected" id="wp-connected" />
                    <Label htmlFor="wp-connected" className="text-sm font-normal cursor-pointer">Connected</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="wp-none" />
                    <Label htmlFor="wp-none" className="text-sm font-normal cursor-pointer">Not Connected</Label>
                  </div>
                </RadioGroup>
              </div>
            </>
          ) : (
            <>
              {/* Community - Multi-select checkboxes */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase">Community</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {uniqueLocations.map(loc => (
                    <div key={loc.id} className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        id={`community-${loc.id}`}
                        checked={communityFilter.includes(loc.id)}
                        onCheckedChange={(checked) => {
                          setCommunityFilter(prev => 
                            checked 
                              ? [...prev, loc.id]
                              : prev.filter(c => c !== loc.id)
                          );
                        }}
                      />
                      <Label htmlFor={`community-${loc.id}`} className="text-sm font-normal cursor-pointer">
                        {loc.display_name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              {/* Status - Multi-select checkboxes */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase">Status</Label>
                <div className="space-y-2">
                  {statusOptions.map(option => (
                    <div key={option.value} className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        id={`status-${option.value}`}
                        checked={propertyStatusFilter.includes(option.value)}
                        onCheckedChange={(checked) => {
                          setPropertyStatusFilter(prev => 
                            checked 
                              ? [...prev, option.value]
                              : prev.filter(s => s !== option.value)
                          );
                        }}
                      />
                      <Label htmlFor={`status-${option.value}`} className="text-sm font-normal cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase">Validation</Label>
                <RadioGroup value={validationFilter} onValueChange={setValidationFilter} className="gap-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="val-all" />
                    <Label htmlFor="val-all" className="text-sm font-normal cursor-pointer">All</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="missing_lot" id="val-missing-lot" />
                    <Label htmlFor="val-missing-lot" className="text-sm font-normal cursor-pointer">Missing Lot #</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unmatched" id="val-unmatched" />
                    <Label htmlFor="val-unmatched" className="text-sm font-normal cursor-pointer">Unmatched Community</Label>
                  </div>
                </RadioGroup>
              </div>
            </>
          )}
          {activeFilters.length > 0 && (
            <>
              <Separator />
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={clearAllFilters}>
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
        title="Locations"
        description="Manage communities, properties, and business configuration"
        extra={
          viewMode === 'communities' && (
            <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
              Add Location
            </Button>
          )
        }
      />

      <div className="space-y-4">
        {/* WordPress Integration - Collapsible */}
        <WordPressIntegrationSection agent={agent} onSyncComplete={handleWordPressSyncComplete} />

        {/* Validation Warning Banner - Properties View */}
        {viewMode === 'properties' && validationStats.missingLotNumber > 0 && (
          <div className="flex items-center gap-3 p-3 bg-warning/10 border border-warning/30 rounded-lg">
            <AlertTriangle size={16} className="text-warning flex-shrink-0" />
            <span className="text-sm flex-1">
              <strong>{validationStats.missingLotNumber}</strong> propert{validationStats.missingLotNumber > 1 ? 'ies are' : 'y is'} missing lot numbers.{' '}
              <span className="text-muted-foreground">Update in WordPress for better identification.</span>
            </span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setValidationFilter('missing_lot')}
              className="text-warning hover:text-warning/80"
            >
              View
            </Button>
          </div>
        )}

        {/* Bulk Actions Bar */}
        {selectedCount > 0 && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg border">
            <span className="text-sm">
              {selectedCount} {viewMode === 'communities' ? 'location' : 'propert'}{selectedCount > 1 ? (viewMode === 'communities' ? 's' : 'ies') : (viewMode === 'communities' ? '' : 'y')} selected
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                <XClose size={14} className="mr-1.5" />
                Clear
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={viewMode === 'communities' ? handleBulkDeleteLocations : handleBulkDeleteProperties}
              >
                <Trash01 size={14} className="mr-1.5" />
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Communities View */}
        {viewMode === 'communities' && (
          <>
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
                  table={locationsTable}
                  searchPlaceholder="Search..."
                  globalFilter
                >
                  {ViewToggle}
                  {FilterPopover}
                </DataTableToolbar>

                {activeFilters.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {activeFilters.map(filter => (
                      <Badge
                        key={`${filter.type}-${filter.value}`}
                        variant="secondary"
                        className="pl-2 pr-1 py-1 gap-1 cursor-pointer hover:bg-secondary/80"
                        onClick={() => clearFilter(filter.type, filter.value)}
                      >
                        {filter.label}
                        <X className="h-3 w-3" />
                      </Badge>
                    ))}
                    {activeFilters.length > 1 && (
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground" onClick={clearAllFilters}>
                        Clear all
                      </Button>
                    )}
                  </div>
                )}

                <DataTable
                  table={locationsTable}
                  columns={locationColumns}
                  onRowClick={(row) => handleViewLocation(row)}
                />

                {displayCount < filteredLocations.length && (
                  <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
                    <span className="text-sm text-muted-foreground">Loading more...</span>
                  </div>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  Showing {displayedLocations.length} of {filteredLocations.length} locations
                </p>
              </div>
            )}
          </>
        )}

        {/* Properties View */}
        {viewMode === 'properties' && (
          <>
            {propertiesWithLocation.length === 0 ? (
              <EmptyState
                icon={<Home01 className="h-5 w-5 text-muted-foreground/50" />}
                title="No properties yet"
                description="Properties will appear here after syncing from WordPress"
              />
            ) : (
              <div className="space-y-3">
                <DataTableToolbar
                  table={propertiesTable}
                  searchPlaceholder="Search..."
                  globalFilter
                >
                  {ViewToggle}
                  {FilterPopover}
                </DataTableToolbar>

                {activeFilters.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {activeFilters.map(filter => (
                      <Badge
                        key={`${filter.type}-${filter.value}`}
                        variant="secondary"
                        className="pl-2 pr-1 py-1 gap-1 cursor-pointer hover:bg-secondary/80"
                        onClick={() => clearFilter(filter.type, filter.value)}
                      >
                        {filter.label}
                        <X className="h-3 w-3" />
                      </Badge>
                    ))}
                    {activeFilters.length > 1 && (
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground" onClick={clearAllFilters}>
                        Clear all
                      </Button>
                    )}
                  </div>
                )}

                <DataTable
                  table={propertiesTable}
                  columns={propertyColumns}
                />

                {displayCount < filteredProperties.length && (
                  <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
                    <span className="text-sm text-muted-foreground">Loading more...</span>
                  </div>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  Showing {displayedProperties.length} of {filteredProperties.length} properties
                </p>
              </div>
            )}
          </>
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
          onConfirm={handleDeleteLocation}
          title="Delete Location"
          description="This will permanently delete this location."
        />

        <SimpleDeleteDialog
          open={!!deleteProperty_}
          onOpenChange={(open) => !open && setDeleteProperty(null)}
          onConfirm={handleDeleteProperty}
          title="Delete Property"
          description="This will permanently delete this property."
        />
      </div>
    </div>
  );
};
