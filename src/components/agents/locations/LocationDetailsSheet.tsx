/**
 * LocationDetailsSheet Component
 * 
 * Sheet for viewing and editing location details.
 * Uses standard Sheet component with built-in CSS animations.
 * 
 * @module components/agents/locations/LocationDetailsSheet
 */

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { LocationDetails } from './LocationDetails';
import type { Tables } from '@/integrations/supabase/types';
import type { LocationFormData } from '@/types/locations';

type Location = Tables<'locations'>;

interface LocationDetailsSheetProps {
  location: Location | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
  onUpdate: (id: string, data: Partial<LocationFormData>) => Promise<boolean>;
}

export const LocationDetailsSheet: React.FC<LocationDetailsSheetProps> = ({
  location,
  open,
  onOpenChange,
  agentId,
  onUpdate,
}) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>{location?.name || 'Location Details'}</SheetTitle>
        </SheetHeader>
        
        {open && location && (
          <LocationDetails
            location={location}
            agentId={agentId}
            onUpdate={onUpdate}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};
