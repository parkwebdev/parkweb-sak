/**
 * Textarea Component
 * 
 * A multi-line text input component with consistent styling,
 * size variants, and proper accessibility attributes.
 * 
 * @module components/ui/textarea
 * 
 * @example
 * ```tsx
 * <Textarea placeholder="Enter your message..." rows={4} />
 * <Textarea size="sm" placeholder="Compact textarea" />
 * ```
 */
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const textareaVariants = cva(
  "flex w-full rounded-md border border-input bg-background placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      size: {
        default: "min-h-[80px] px-3 py-2 text-sm",
        sm: "min-h-[60px] px-2.5 py-1.5 text-xs",
        lg: "min-h-[120px] px-4 py-3 text-base",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, size, ...props }, ref) => {
    return (
      <textarea
        className={cn(textareaVariants({ size }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea, textareaVariants }
