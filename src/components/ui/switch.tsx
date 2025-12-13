/**
 * Switch Component
 * 
 * A toggle switch with smooth animations and tactile feedback.
 * Uses Framer Motion for whileTap squeeze effect.
 * 
 * @module components/ui/switch
 */
import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { tapPress, springs } from "@/lib/motion-variants"

interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
  thumbIcon?: React.ReactNode
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, startIcon, endIcon, thumbIcon, ...props }, ref) => {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <SwitchPrimitives.Root asChild ref={ref} {...props}>
      <motion.button
        whileTap={prefersReducedMotion ? undefined : tapPress}
        transition={springs.micro}
        className={cn(
          "peer relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/70 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-success data-[state=unchecked]:bg-input",
          className
        )}
      >
        {startIcon && (
          <span className="absolute left-1.5 z-10 text-2xs text-primary-foreground opacity-0 transition-opacity duration-200 data-[state=checked]:opacity-100">
            {startIcon}
          </span>
        )}
        {endIcon && (
          <span className="absolute right-1.5 z-10 text-2xs text-muted-foreground opacity-0 transition-opacity duration-200 data-[state=unchecked]:opacity-100">
            {endIcon}
          </span>
        )}
        <SwitchPrimitives.Thumb
          className={cn(
            "pointer-events-none flex h-5 w-5 items-center justify-center rounded-full bg-background shadow-lg ring-0",
            "transition-transform duration-200 ease-out",
            "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
          )}
        >
          {thumbIcon && <span className="text-2xs">{thumbIcon}</span>}
        </SwitchPrimitives.Thumb>
      </motion.button>
    </SwitchPrimitives.Root>
  )
})

Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
