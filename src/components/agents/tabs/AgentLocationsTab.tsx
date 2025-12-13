/**
 * AgentLocationsTab Component
 * 
 * Two-panel layout for managing agent locations.
 * Left panel: Location list, Right panel: Location details.
 * 
 * @module components/agents/tabs/AgentLocationsTab
 */

import React, { useState } from 'react';
import { Plus } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { LocationList } from '@/components/agents/locations/LocationList';
import { LocationDetails } from '@/components/agents/locations/LocationDetails';
import { CreateLocationDialog } from '@/components/agents/locations/CreateLocationDialog';
import { useLocations } from '@/hooks/useLocations';
import type { Tables } from '@/integrations/supabase/types';

type Location = Tables<'locations'>;

interface AgentLocationsTabProps {
  agentId: string;
  userId: string;
}

export const AgentLocationsTab: React.FC<AgentLocationsTabProps> = ({
  agentId,
  userId,
}) => {
  const { locations, loading, createLocation, updateLocation, deleteLocation } = useLocations(agentId);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const selectedLocation = locations.find(l => l.id === selectedLocationId);

  const handleCreateLocation = async (data: Parameters<typeof createLocation>[0]) => {
    const id = await createLocation(data, userId);
    if (id) {
      setSelectedLocationId(id);
      setIsCreateDialogOpen(false);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    const success = await deleteLocation(id);
    if (success && selectedLocationId === id) {
      setSelectedLocationId(null);
    }
  };

  if (loading) {
    return <LoadingState text="Loading locations..." />;
  }

  if (locations.length === 0) {
    return (
      <>
        <EmptyState
          icon="building"
          title="No locations yet"
          description="Add locations to organize your properties, connect calendars, and enable location-based routing."
          action={
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus size={16} className="mr-2" />
              Add Location
            </Button>
          }
        />
        <CreateLocationDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onCreate={handleCreateLocation}
        />
      </>
    );
  }

  return (
    <div className="flex gap-6 h-full min-h-0">
      {/* Left Panel - Location List */}
      <div className="w-80 flex-shrink-0 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            {locations.length} Location{locations.length !== 1 ? 's' : ''}
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus size={14} className="mr-1.5" />
            Add
          </Button>
        </div>
        <LocationList
          locations={locations}
          selectedId={selectedLocationId}
          onSelect={setSelectedLocationId}
          onDelete={handleDeleteLocation}
        />
      </div>

      {/* Right Panel - Location Details */}
      <div className="flex-1 min-h-0">
        {selectedLocation ? (
          <LocationDetails
            location={selectedLocation}
            agentId={agentId}
            onUpdate={updateLocation}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a location to view details
          </div>
        )}
      </div>

      <CreateLocationDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreate={handleCreateLocation}
      />
    </div>
  );
};
