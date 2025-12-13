/**
 * LocationDetailsSheet Component
 * 
 * Sheet for viewing and editing location details with proper exit animations.
 * 
 * @module components/agents/locations/LocationDetailsSheet
 */

import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Sheet,
  SheetHeader,
  SheetTitle,
  SheetPortal,
} from '@/components/ui/sheet';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { X } from '@untitledui/icons';
import { LocationDetails } from './LocationDetails';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springs } from '@/lib/motion-variants';
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

const slideVariants = {
  hidden: { x: "100%", opacity: 0.8 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: springs.smooth
  },
  exit: { 
    x: "100%", 
    opacity: 0.8,
    transition: { ...springs.snappy, duration: 0.2 }
  },
};

const reducedVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const LocationDetailsSheet: React.FC<LocationDetailsSheetProps> = ({
  location,
  open,
  onOpenChange,
  agentId,
  onUpdate,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const variants = prefersReducedMotion ? reducedVariants : slideVariants;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <SheetPortal forceMount>
            {/* Overlay */}
            <SheetPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={() => onOpenChange(false)}
              />
            </SheetPrimitive.Overlay>

            {/* Content */}
            <SheetPrimitive.Content asChild forceMount>
              <motion.div
                className={cn(
                  "fixed z-50 gap-4 bg-background p-6 shadow-lg",
                  "inset-y-0 right-0 h-full w-full sm:max-w-xl border-l",
                  "overflow-y-auto"
                )}
                variants={variants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
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

                <SheetPrimitive.Close 
                  className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 disabled:pointer-events-none"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </SheetPrimitive.Close>
              </motion.div>
            </SheetPrimitive.Content>
          </SheetPortal>
        )}
      </AnimatePresence>
    </Sheet>
  );
};
