/**
 * LocationDetailsSheet Component
 * 
 * Sheet component for viewing and editing location details.
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
      {open && (
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>{location?.name || 'Location Details'}</SheetTitle>
          </SheetHeader>
          {location && (
            <LocationDetails
              location={location}
              agentId={agentId}
              onUpdate={onUpdate}
            />
          )}
        </SheetContent>
      )}
    </Sheet>
  );
};
