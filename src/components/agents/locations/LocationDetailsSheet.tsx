/**
 * LocationDetailsSheet Component
 * 
 * Sheet for viewing and editing location details.
 * Uses deferred content mounting to prevent freeze on open.
 * 
 * @module components/agents/locations/LocationDetailsSheet
 */

import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { LocationDetails } from './LocationDetails';
import { SkeletonLocationDetails } from '@/components/ui/page-skeleton';
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
  // Defer content mounting until after sheet animation starts
  const [contentReady, setContentReady] = useState(false);

  useEffect(() => {
    if (open) {
      // Small delay to let sheet animation start before mounting heavy form
      const timer = setTimeout(() => setContentReady(true), 50);
      return () => clearTimeout(timer);
    } else {
      setContentReady(false);
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>{location?.name || 'Location Details'}</SheetTitle>
        </SheetHeader>
        
        {!contentReady || !location ? (
          <SkeletonLocationDetails />
        ) : (
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
