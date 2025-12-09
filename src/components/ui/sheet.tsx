import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "@untitledui/icons"
import * as React from "react"
import { motion, AnimatePresence } from "motion/react"

import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { springs, overlayVariants, sidebarVariants, getVariants, fadeReducedVariants } from "@/lib/motion-variants"

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  const prefersReducedMotion = useReducedMotion();
  const variants = getVariants(overlayVariants, fadeReducedVariants, prefersReducedMotion);

  return (
    <SheetPrimitive.Overlay ref={ref} asChild forceMount {...props}>
      <motion.div
        className={cn(
          "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm",
          className
        )}
        variants={variants}
        initial="hidden"
        animate="visible"
        exit="exit"
      />
    </SheetPrimitive.Overlay>
  );
})
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b",
        bottom: "inset-x-0 bottom-0 border-t",
        left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

// Motion variants for each side
const getSlideVariants = (side: "top" | "bottom" | "left" | "right") => {
  const offScreen = {
    top: { y: "-100%" },
    bottom: { y: "100%" },
    left: { x: "-100%" },
    right: { x: "100%" },
  };

  return {
    hidden: { ...offScreen[side], opacity: 0.8 },
    visible: { 
      x: 0, 
      y: 0, 
      opacity: 1,
      transition: springs.smooth
    },
    exit: { 
      ...offScreen[side], 
      opacity: 0.8,
      transition: { ...springs.snappy, duration: 0.2 }
    },
  };
};

const reducedSlideVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
  VariantProps<typeof sheetVariants> { }

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => {
  const prefersReducedMotion = useReducedMotion();
  const slideVariants = getSlideVariants(side!);
  const variants = getVariants(slideVariants, reducedSlideVariants, prefersReducedMotion);

  return (
    <SheetPortal forceMount>
      <AnimatePresence mode="wait">
        <SheetOverlay />
        <SheetPrimitive.Content ref={ref} asChild forceMount {...props}>
          <motion.div
            className={cn(sheetVariants({ side }), className)}
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {children}
            <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 disabled:pointer-events-none data-[state=open]:bg-secondary">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </SheetPrimitive.Close>
          </motion.div>
        </SheetPrimitive.Content>
      </AnimatePresence>
    </SheetPortal>
  );
})
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet, SheetClose,
  SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetOverlay, SheetPortal, SheetTitle, SheetTrigger
}

