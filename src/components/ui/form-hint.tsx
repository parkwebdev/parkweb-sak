/**
 * FormHint Component
 * 
 * Standalone helper/description text for form fields.
 * Use outside React Hook Form contexts (for RHF, use FormDescription).
 * Includes id prop for aria-describedby accessibility linking.
 * 
 * @module components/ui/form-hint
 * 
 * @example
 * ```tsx
 * <Input aria-describedby="email-hint" />
 * <FormHint id="email-hint">We'll never share your email.</FormHint>
 * ```
 */
import * as React from "react"
import { cn } from "@/lib/utils"

export interface FormHintProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** ID for aria-describedby linking to form control */
  id?: string
}

const FormHint = React.forwardRef<HTMLParagraphElement, FormHintProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn("text-xs text-muted-foreground mt-1.5", className)}
        {...props}
      >
        {children}
      </p>
    )
  }
)
FormHint.displayName = "FormHint"

export { FormHint }
