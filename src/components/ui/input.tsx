import * as React from "react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/hooks/useReducedMotion"

interface InputProps extends Omit<React.ComponentProps<"input">, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  /** Show error state with shake animation */
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion()
    
    // Error shake animation
    const shakeAnimation = error && !prefersReducedMotion ? {
      x: [0, -4, 4, -4, 4, 0],
      transition: { duration: 0.4 }
    } : {}

    return (
      <motion.input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "transition-shadow duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        ref={ref}
        animate={shakeAnimation}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
