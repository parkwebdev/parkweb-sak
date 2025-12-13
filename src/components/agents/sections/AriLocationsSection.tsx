/**
 * AriLocationsSection
 * 
 * Locations management with TanStack Table.
 */

import { useState, useMemo } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, getPaginationRowModel, type SortingState, type RowSelectionState } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Plus, Trash01, XClose } from '@untitledui/icons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocations } from '@/hooks/useLocations';
import { useAgents } from '@/hooks/useAgents';
import { useConnectedAccounts } from '@/hooks/useConnectedAccounts';
import { CreateLocationDialog } from '@/components/agents/locations/CreateLocationDialog';
import { LocationDetailsSheet } from '@/components/agents/locations/LocationDetailsSheet';
import { WordPressConnectionCard } from '@/components/agents/locations/WordPressConnectionCard';
import { WordPressHomesCard } from '@/components/agents/locations/WordPressHomesCard';
import { AriSectionHeader } from './AriSectionHeader';
import { LoadingState } from '@/components/ui/loading-state';
import { SimpleDeleteDialog } from '@/components/ui/simple-delete-dialog';
import { DataTable } from '@/components/data-table/DataTable';
import { DataTableToolbar } from '@/components/data-table/DataTableToolbar';
import { DataTablePagination } from '@/components/data-table/DataTablePagination';
import { createLocationsColumns, type LocationWithCounts } from '@/components/data-table/columns';
import { EmptyState } from '@/components/ui/empty-state';
import { MarkerPin01 } from '@untitledui/icons';
import { toast } from 'sonner';

interface AriLocationsSectionProps {
  agentId: string;
  userId: string;
}

export const AriLocationsSection: React.FC<AriLocationsSectionProps> = ({ agentId, userId }) => {
  const { locations, loading, createLocation, updateLocation, deleteLocation, refetch } = useLocations(agentId);
  const { agents } = useAgents();
  const { accounts } = useConnectedAccounts(undefined, agentId);
  
  const agent = agents.find(a => a.id === agentId) || null;
  
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

  // Enrich locations with calendar counts
  const locationsWithCounts: LocationWithCounts[] = useMemo(() => {
    return locations.map(location => ({
      ...location,
      calendarCount: accounts.filter(a => a.location_id === location.id).length,
    }));
  }, [locations, accounts]);

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
      
      return true;
    });
  }, [locationsWithCounts, calendarFilter, wordpressFilter]);

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

  const handleView = (location: LocationWithCounts) => {
    setSelectedLocation(location);
    setSheetOpen(true);
  };

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

  const columns = useMemo(() => createLocationsColumns({
    onView: handleView,
    onDelete: setDeleteLocation,
  }), []);

  const table = useReactTable({
    data: filteredLocations,
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
    getPaginationRowModel: getPaginationRowModel(),
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
            <Plus size={14} className="mr-1.5" />
            Add Location
          </Button>
        }
      />

      <div className="space-y-4">
        {/* WordPress Cards */}
        <WordPressConnectionCard agent={agent} onSyncComplete={refetch} />
        <WordPressHomesCard agent={agent} onSyncComplete={refetch} />

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
                <Plus size={14} className="mr-1.5" />
                Add Location
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            <DataTableToolbar
              table={table}
              searchPlaceholder="Search locations..."
              globalFilter
            >
              <Select value={calendarFilter} onValueChange={setCalendarFilter}>
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue placeholder="Calendars" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Calendars</SelectItem>
                  <SelectItem value="connected">Connected</SelectItem>
                  <SelectItem value="none">No Calendars</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={wordpressFilter} onValueChange={setWordpressFilter}>
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue placeholder="WordPress" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All WordPress</SelectItem>
                  <SelectItem value="connected">Connected</SelectItem>
                  <SelectItem value="none">Not Connected</SelectItem>
                </SelectContent>
              </Select>
            </DataTableToolbar>
            <DataTable
              table={table}
              columns={columns}
              onRowClick={(row) => handleView(row)}
            />
            <DataTablePagination table={table} />
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
