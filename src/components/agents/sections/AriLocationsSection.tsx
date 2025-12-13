/**
 * AriLocationsSection
 * 
 * Locations management with TanStack Table.
 */

import { useState, useMemo } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, getPaginationRowModel, type SortingState } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Plus } from '@untitledui/icons';
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

  // Enrich locations with calendar counts
  const locationsWithCounts: LocationWithCounts[] = useMemo(() => {
    return locations.map(location => ({
      ...location,
      calendarCount: accounts.filter(a => a.location_id === location.id).length,
    }));
  }, [locations, accounts]);

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

  const columns = useMemo(() => createLocationsColumns({
    onView: handleView,
    onDelete: setDeleteLocation,
  }), []);

  const table = useReactTable({
    data: locationsWithCounts,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

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
            />
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
