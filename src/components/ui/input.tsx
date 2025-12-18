/**
 * Input Component
 * 
 * A styled input field with size variants and error state animation.
 * Supports all standard HTML input attributes with Framer Motion.
 * 
 * @module components/ui/input
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/hooks/useReducedMotion"

/**
 * Input variant styles using class-variance-authority
 * @internal
 */
const inputVariants = cva(
  "flex w-full rounded-md border border-input bg-background px-3 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground disabled:cursor-not-allowed disabled:opacity-50 transition-shadow duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      size: {
        default: "h-10 py-2 text-base md:text-sm placeholder:text-sm",
        sm: "h-8 py-1 text-xs placeholder:text-xs",
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

// Shake animation keyframes for error state
const shakeAnimation = {
  x: [0, -4, 4, -4, 4, -2, 2, 0],
  transition: { duration: 0.4, ease: "easeInOut" as const }
};

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
  ({ className, type, error, size, onChange, onFocus, onBlur, onKeyDown, onKeyUp, value, placeholder, name, id, disabled, readOnly, required, autoComplete, autoFocus, maxLength, minLength, pattern, ...rest }, ref) => {
    const prefersReducedMotion = useReducedMotion();
    
    return (
      <motion.input
        type={type}
        className={cn(
          inputVariants({ size }),
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        ref={ref}
        name={name}
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        maxLength={maxLength}
        minLength={minLength}
        pattern={pattern}
        animate={error && !prefersReducedMotion ? shakeAnimation : undefined}
      />
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
