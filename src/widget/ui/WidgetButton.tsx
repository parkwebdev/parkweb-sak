/**
 * WidgetButton Component
 * 
 * Lightweight button matching src/components/ui/button.tsx exactly.
 * Uses CSS active:scale instead of motion/react for tap animation.
 * 
 * @module widget/ui/WidgetButton
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { WidgetSpinner } from "./WidgetSpinner";

/**
 * Button variant styles - EXACT match from src/components/ui/button.tsx
 */
const widgetButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-medium leading-none transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 border border-transparent",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 border border-transparent",
        outline: "border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent",
        ghost: "hover:bg-accent hover:text-accent-foreground border border-transparent",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-2.5",
        lg: "h-11 px-6",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface WidgetButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof widgetButtonVariants> {
  /** Show loading spinner and disable interactions */
  loading?: boolean;
}

/**
 * Lightweight button component for widget.
 * Uses CSS active:scale-[0.98] instead of Framer Motion.
 */
const WidgetButton = React.forwardRef<HTMLButtonElement, WidgetButtonProps>(
  ({ className, variant, size, loading = false, disabled, children, ...props }, ref) => {
    return (
      <button
        className={cn(
          widgetButtonVariants({ variant, size, className }),
          !disabled && !loading && "active:scale-[0.98] transition-transform duration-75"
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <WidgetSpinner size="sm" /> : children}
      </button>
    );
  }
);
WidgetButton.displayName = "WidgetButton";

export { WidgetButton, widgetButtonVariants };
