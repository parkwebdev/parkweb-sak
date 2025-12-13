/**
 * IconButton Component
 * 
 * Accessible icon-only button with required aria-label.
 * Inherits all Button variants and motion animations.
 * Forces accessibility by requiring a label prop.
 * 
 * @module components/ui/icon-button
 * 
 * @example
 * ```tsx
 * <IconButton label="Delete item" variant="ghost" size="sm">
 *   <Trash2 className="h-4 w-4" />
 * </IconButton>
 * ```
 */
import * as React from "react"
import { Button, type ButtonProps } from "./button"
import { cn } from "@/lib/utils"

export interface IconButtonProps extends Omit<ButtonProps, 'aria-label'> {
  /** Required accessible label describing the button action */
  label: string
  /** The icon to display */
  children: React.ReactNode
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, children, className, size = "icon", ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size={size}
        aria-label={label}
        className={cn("shrink-0", className)}
        {...props}
      >
        {children}
      </Button>
    )
  }
)
IconButton.displayName = "IconButton"

export { IconButton }
