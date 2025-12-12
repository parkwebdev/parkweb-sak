/**
 * Input Component
 * 
 * A styled input field with size variants and error state animation.
 * Supports all standard HTML input attributes.
 * 
 * @module components/ui/input
 */

import * as React from "react"
import { motion } from "motion/react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/hooks/useReducedMotion"

/**
 * Input variant styles using class-variance-authority
 * @internal
 */
const inputVariants = cva(
  "flex w-full rounded-md border border-input bg-background px-3 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 transition-shadow duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/70",
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

/**
 * Input component props
 */
interface InputProps 
  extends Omit<React.ComponentProps<"input">, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag' | 'size'>,
    VariantProps<typeof inputVariants> {
  /** Show error state with red border and shake animation */
  error?: boolean
}

/**
 * Input component with size variants and error state.
 * 
 * @example
 * // Basic input
 * <Input placeholder="Enter your email" />
 * 
 * @example
 * // Small input with error state
 * <Input size="sm" error={hasError} />
 * 
 * @example
 * // Password input
 * <Input type="password" placeholder="Password" />
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, size, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion()
    
    // Error shake animation respects reduced motion preference
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