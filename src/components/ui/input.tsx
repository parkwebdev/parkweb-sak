/**
 * Input Component
 * 
 * A styled input field with size variants and error state animation.
 * Supports all standard HTML input attributes.
 * 
 * @module components/ui/input
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Input variant styles using class-variance-authority
 * @internal
 */
const inputVariants = cva(
  "flex w-full rounded-md border border-input bg-background px-3 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 transition-shadow duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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
  extends Omit<React.ComponentProps<"input">, 'size'>,
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
    return (
      <input
        type={type}
        className={cn(
          inputVariants({ size }),
          error && "border-destructive focus-visible:ring-destructive animate-shake",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
