import * as React from "react"
import { motion } from "motion/react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/hooks/useReducedMotion"

const inputVariants = cva(
  "flex w-full rounded-md border border-input bg-background px-3 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 transition-shadow duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
  {
    variants: {
      size: {
        default: "h-10 py-2 text-base md:text-sm",
        sm: "h-8 py-1 text-sm",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

interface InputProps 
  extends Omit<React.ComponentProps<"input">, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag' | 'size'>,
    VariantProps<typeof inputVariants> {
  /** Show error state with shake animation */
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, size, ...props }, ref) => {
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
          inputVariants({ size }),
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

export { Input, inputVariants }
