/**
 * LocationList Component
 * 
 * Displays a scrollable list of locations with selection state.
 * 
 * @module components/agents/locations/LocationList
 */

import React from 'react';
import { Building01, MarkerPin01, Trash01 } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SimpleDeleteDialog } from '@/components/ui/simple-delete-dialog';
import type { Tables } from '@/integrations/supabase/types';

type Location = Tables<'locations'>;

interface LocationListProps {
  locations: Location[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export const LocationList: React.FC<LocationListProps> = ({
  locations,
  selectedId,
  onSelect,
  onDelete,
}) => {
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const locationToDelete = locations.find(l => l.id === deleteId);

  return (
    <>
      <ScrollArea className="flex-1">
        <div className="space-y-2 pr-4">
          {locations.map((location) => (
            <div
              key={location.id}
              className={cn(
                'group flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                selectedId === location.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              )}
              onClick={() => onSelect(location.id)}
            >
              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                <Building01 size={18} className="text-muted-foreground" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{location.name}</p>
                {(location.city || location.state) && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MarkerPin01 size={12} />
                    {[location.city, location.state].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteId(location.id);
                }}
              >
                <Trash01 size={14} className="text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>

      <SimpleDeleteDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Location"
        description={`Are you sure you want to delete "${locationToDelete?.name}"? This will also remove all connected calendars and properties linked to this location.`}
        onConfirm={() => {
          if (deleteId) {
            onDelete(deleteId);
            setDeleteId(null);
          }
        }}
      />
    </>
  );
};
