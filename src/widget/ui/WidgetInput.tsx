/**
 * WidgetInput Component
 * 
 * Lightweight input matching src/components/ui/input.tsx exactly.
 * Native input element without motion/react dependency.
 * 
 * @module widget/ui/WidgetInput
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Input variant styles - EXACT match from src/components/ui/input.tsx
 */
const widgetInputVariants = cva(
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
);

interface WidgetInputProps 
  extends Omit<React.ComponentProps<"input">, 'size'>,
    VariantProps<typeof widgetInputVariants> {
  /** Show error state with red border */
  error?: boolean;
}

/**
 * Lightweight input component for widget.
 * Native input without Framer Motion animations.
 */
const WidgetInput = React.forwardRef<HTMLInputElement, WidgetInputProps>(
  ({ className, type, error, size, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          widgetInputVariants({ size }),
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
WidgetInput.displayName = "WidgetInput";

export { WidgetInput, widgetInputVariants };
