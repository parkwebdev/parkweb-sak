/**
 * Collapsible Component
 * 
 * An expandable/collapsible section using pure Radix + CSS animations.
 * Supports lazy rendering to defer mounting of children until opened.
 * 
 * @module components/ui/collapsible
 */
'use client';

import * as React from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { cn } from '@/lib/utils';

interface CollapsibleProps extends React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root> {
  /** If true, CollapsibleContent children are only rendered when open */
  lazy?: boolean;
}

// Create a context to pass lazy prop and open state to CollapsibleContent
const LazyContext = React.createContext<{ lazy?: boolean; open?: boolean }>({});

const Collapsible = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Root>,
  CollapsibleProps
>(({ lazy, open, defaultOpen, onOpenChange, children, ...props }, ref) => {
  // Track controlled/uncontrolled open state
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen ?? false);
  const isOpen = open ?? internalOpen;

  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    setInternalOpen(newOpen);
    onOpenChange?.(newOpen);
  }, [onOpenChange]);

  return (
    <LazyContext.Provider value={{ lazy, open: isOpen }}>
      <CollapsiblePrimitive.Root
        ref={ref}
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={handleOpenChange}
        {...props}
      >
        {children}
      </CollapsiblePrimitive.Root>
    </LazyContext.Provider>
  );
});
Collapsible.displayName = 'Collapsible';

const CollapsibleTrigger = CollapsiblePrimitive.Trigger;

const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const { lazy, open } = React.useContext(LazyContext);
  const [hasOpened, setHasOpened] = React.useState(open ?? false);

  // Track if the collapsible has ever been opened
  React.useEffect(() => {
    if (open && !hasOpened) {
      setHasOpened(true);
    }
  }, [open, hasOpened]);

  // For lazy rendering, only render children if opened at least once
  const shouldRenderChildren = lazy ? hasOpened : true;

  return (
    <CollapsiblePrimitive.Content
      ref={ref}
      className={cn(
        'overflow-hidden',
        'data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
        className
      )}
      {...props}
    >
      {shouldRenderChildren ? children : null}
    </CollapsiblePrimitive.Content>
  );
});
CollapsibleContent.displayName = 'CollapsibleContent';

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
