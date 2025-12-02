import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range 
        className="absolute h-full" 
        style={{
          background: 'linear-gradient(to right, #3b82f6, #06b6d4, #22c55e, #eab308, #f97316, #ef4444)'
        }}
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="relative block h-4 w-4 rounded-full bg-primary shadow-md transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 before:absolute before:inset-0 before:rounded-full before:bg-primary/20 before:scale-100 before:opacity-0 hover:before:scale-150 hover:before:opacity-100 before:transition-all before:duration-300" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
