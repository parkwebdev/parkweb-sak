/**
 * WidgetSelect Component
 * 
 * Native select element styled to match Radix Select appearance.
 * Saves ~20KB by not using @radix-ui/react-select.
 * 
 * @module widget/ui/WidgetSelect
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Select trigger styles - matches Radix SelectTrigger appearance
 */
const widgetSelectVariants = cva(
  "flex w-full items-center justify-between rounded-md border border-input bg-background px-3 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background appearance-none cursor-pointer",
  {
    variants: {
      size: {
        default: "h-10 py-2 text-sm",
        sm: "h-8 py-1 text-xs",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

interface WidgetSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    VariantProps<typeof widgetSelectVariants> {
  /** Placeholder text when no value selected */
  placeholder?: string;
  /** Callback when value changes */
  onValueChange?: (value: string) => void;
}

/**
 * Lightweight native select component for widget.
 * 
 * @example
 * <WidgetSelect value={value} onValueChange={setValue} placeholder="Select...">
 *   <option value="a">Option A</option>
 *   <option value="b">Option B</option>
 * </WidgetSelect>
 */
const WidgetSelect = React.forwardRef<HTMLSelectElement, WidgetSelectProps>(
  ({ className, size, placeholder, value, onValueChange, onChange, children, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onValueChange) {
        onValueChange(e.target.value);
      }
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <div className="relative">
        <select
          ref={ref}
          value={value}
          onChange={handleChange}
          className={cn(
            widgetSelectVariants({ size }),
            "pr-8", // Space for chevron
            !value && "text-muted-foreground",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        {/* Chevron icon */}
        <svg
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    );
  }
);
WidgetSelect.displayName = "WidgetSelect";

/**
 * Option component for WidgetSelect.
 * Simple wrapper around native option element.
 */
interface WidgetSelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {}

const WidgetSelectItem = React.forwardRef<HTMLOptionElement, WidgetSelectItemProps>(
  ({ className, ...props }, ref) => {
    return <option ref={ref} className={className} {...props} />;
  }
);
WidgetSelectItem.displayName = "WidgetSelectItem";

export { WidgetSelect, WidgetSelectItem, widgetSelectVariants };
