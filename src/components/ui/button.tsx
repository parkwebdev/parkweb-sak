import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"
import { Spinner } from "./spinner"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { springs } from "@/lib/motion-variants"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-medium leading-none transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 border border-transparent",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 border border-transparent",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent",
        ghost: "hover:bg-accent hover:text-accent-foreground border border-transparent",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 px-2.5",
        sm: "h-8 px-2.5",
        lg: "h-10 px-4",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Omit conflicting event handlers between React and Framer Motion
type ConflictingProps = 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, ConflictingProps>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion()
    const Comp = asChild ? Slot : "button"
    
    // When asChild is true, Slot requires exactly one child element
    // Don't show loading spinner or motion when asChild is used
    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          disabled={disabled || loading}
          {...props}
        >
          {children}
        </Comp>
      )
    }

    // Motion tap/hover config - subtle feedback
    const motionProps = prefersReducedMotion ? {} : {
      whileTap: { scale: 0.98 },
      whileHover: variant !== 'link' ? { scale: 1.01 } : undefined,
      transition: springs.micro,
    }
    
    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...motionProps}
        {...props}
      >
        {loading ? <Spinner size="sm" /> : children}
      </motion.button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
