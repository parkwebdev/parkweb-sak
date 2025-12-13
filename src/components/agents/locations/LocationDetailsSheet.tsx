/**
 * LocationDetailsSheet Component
 * 
 * Sheet for viewing and editing location details with proper exit animations.
 * Uses a custom implementation to ensure exit animations work correctly.
 * 
 * @module components/agents/locations/LocationDetailsSheet
 */

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from '@untitledui/icons';
import { LocationDetails } from './LocationDetails';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
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
    transition: { type: "spring" as const, damping: 30, stiffness: 300 }
  },
  exit: { 
    x: "100%", 
    opacity: 0.8,
    transition: { duration: 0.2 }
  },
} as const;

const reducedVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
} as const;

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
  
  // Track internal open state for exit animations
  const [internalOpen, setInternalOpen] = useState(open);
  const [shouldRender, setShouldRender] = useState(open);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      setInternalOpen(true);
    } else {
      setInternalOpen(false);
    }
  }, [open]);

  const handleAnimationComplete = (definition: string) => {
    if (definition === 'exit') {
      setShouldRender(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!shouldRender) return null;

  return (
    <DialogPrimitive.Root open={true} onOpenChange={handleClose}>
      <DialogPrimitive.Portal forceMount>
        <AnimatePresence mode="wait" onExitComplete={() => setShouldRender(false)}>
          {internalOpen && (
            <>
              {/* Overlay */}
              <DialogPrimitive.Overlay asChild forceMount>
                <motion.div
                  key="overlay"
                  className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
                  variants={overlayVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onClick={handleClose}
                />
              </DialogPrimitive.Overlay>

              {/* Content */}
              <DialogPrimitive.Content asChild forceMount>
                <motion.div
                  key="content"
                  className={cn(
                    "fixed z-50 gap-4 bg-background p-6 shadow-lg",
                    "inset-y-0 right-0 h-full w-full sm:max-w-xl border-l",
                    "overflow-y-auto focus:outline-none"
                  )}
                  variants={variants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onAnimationComplete={handleAnimationComplete}
                >
                  <div className="flex items-center justify-between mb-6">
                    <DialogPrimitive.Title className="text-lg font-semibold">
                      {location?.name || 'Location Details'}
                    </DialogPrimitive.Title>
                    <DialogPrimitive.Close 
                      className="rounded-sm opacity-70 transition-opacity hover:opacity-100 disabled:pointer-events-none"
                      onClick={handleClose}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Close</span>
                    </DialogPrimitive.Close>
                  </div>
                  
                  {location && (
                    <LocationDetails
                      location={location}
                      agentId={agentId}
                      onUpdate={onUpdate}
                    />
                  )}
                </motion.div>
              </DialogPrimitive.Content>
            </>
          )}
        </AnimatePresence>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
