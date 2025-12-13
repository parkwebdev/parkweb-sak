/**
 * Switch Component
 * 
 * A toggle switch with smooth CSS-based animations.
 * Uses pure CSS transitions for performance.
 * 
 * @module components/ui/switch
 */
import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
  thumbIcon?: React.ReactNode
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, startIcon, endIcon, thumbIcon, ...props }, ref) => {
  return (
    <SwitchPrimitives.Root
      ref={ref}
      className={cn(
        "peer relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/70 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-success data-[state=unchecked]:bg-input",
        className
      )}
      {...props}
    >
      {startIcon && (
        <span className="absolute left-1.5 z-10 text-[10px] text-primary-foreground opacity-0 transition-opacity duration-200 data-[state=checked]:opacity-100">
          {startIcon}
        </span>
      )}
      {endIcon && (
        <span className="absolute right-1.5 z-10 text-[10px] text-muted-foreground opacity-0 transition-opacity duration-200 data-[state=unchecked]:opacity-100">
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
        {thumbIcon && <span className="text-[10px]">{thumbIcon}</span>}
      </SwitchPrimitives.Thumb>
    </SwitchPrimitives.Root>
  )
})

Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
