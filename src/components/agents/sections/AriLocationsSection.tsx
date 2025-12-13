/**
 * AriLocationsSection
 * 
 * Locations management.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { MarkerPin01, Plus, Trash01 } from '@untitledui/icons';
import { useLocations } from '@/hooks/useLocations';
import { useAgents } from '@/hooks/useAgents';
import { useProperties } from '@/hooks/useProperties';
import { LocationDetails } from '@/components/agents/locations/LocationDetails';
import { CreateLocationDialog } from '@/components/agents/locations/CreateLocationDialog';
import { WordPressConnectionCard } from '@/components/agents/locations/WordPressConnectionCard';
import { WordPressHomesCard } from '@/components/agents/locations/WordPressHomesCard';
import { AriSectionHeader } from './AriSectionHeader';
import { LoadingState } from '@/components/ui/loading-state';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { SimpleDeleteDialog } from '@/components/ui/simple-delete-dialog';
import { cn } from '@/lib/utils';

interface AriLocationsSectionProps {
  agentId: string;
  userId: string;
}

export const AriLocationsSection: React.FC<AriLocationsSectionProps> = ({ agentId, userId }) => {
  const { locations, loading, createLocation, updateLocation, deleteLocation, refetch } = useLocations(agentId);
  const { agents } = useAgents();
  const { properties } = useProperties(agentId);
  
  const agent = agents.find(a => a.id === agentId) || null;
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [deleteLocationId, setDeleteLocationId] = useState<string | null>(null);

  const selectedLocation = locations.find(l => l.id === selectedLocationId);

  const handleCreate = async (data: Parameters<typeof createLocation>[0]) => {
    const id = await createLocation(data, userId);
    if (id) {
      setSelectedLocationId(id);
      setCreateDialogOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteLocationId) return;
    const success = await deleteLocation(deleteLocationId);
    if (success && selectedLocationId === deleteLocationId) {
      setSelectedLocationId(null);
    }
    setDeleteLocationId(null);
  };

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

        <div className="flex gap-6 min-h-[400px]">
          {/* Left Panel - Location List */}
          <div className="w-72 flex-shrink-0 flex flex-col">
            {locations.length === 0 ? (
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
              <ScrollArea className="flex-1">
                <div className="space-y-1 pr-4">
                  {locations.map((location) => {
                    const propertyCount = properties.filter(p => p.location_id === location.id).length;
                    const isSelected = selectedLocationId === location.id;
                    
                    return (
                      <div
                        key={location.id}
                        onClick={() => setSelectedLocationId(location.id)}
                        className={cn(
                          "group w-full text-left p-3 rounded-lg border transition-colors cursor-pointer",
                          isSelected 
                            ? "border-primary bg-primary/5" 
                            : "border-transparent hover:bg-muted/50"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{location.name}</div>
                            {location.city && location.state && (
                              <div className="text-xs text-muted-foreground truncate">
                                {location.city}, {location.state}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {propertyCount > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {propertyCount}
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteLocationId(location.id);
                              }}
                            >
                              <Trash01 size={14} className="text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Right Panel - Details */}
          <div className="flex-1 min-h-0">
            {selectedLocation ? (
              <LocationDetails
                location={selectedLocation}
                agentId={agentId}
                onUpdate={updateLocation}
              />
            ) : locations.length > 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a location to view details
              </div>
            ) : null}
          </div>
        </div>

        <CreateLocationDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onCreate={handleCreate}
        />

        <SimpleDeleteDialog
          open={!!deleteLocationId}
          onOpenChange={(open) => !open && setDeleteLocationId(null)}
          onConfirm={handleDelete}
          title="Delete Location"
          description="This will permanently delete this location."
        />
      </div>
    </div>
  );
};
