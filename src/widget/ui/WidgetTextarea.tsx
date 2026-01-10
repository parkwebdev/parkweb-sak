/**
 * WidgetTextarea Component
 * 
 * Lightweight textarea for the widget, isolated from main app dependencies.
 * Mirrors the main app Textarea but without @radix-ui dependencies.
 * 
 * @module widget/ui/WidgetTextarea
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const widgetTextareaVariants = cva(
  'flex w-full rounded-md border border-input bg-background text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none',
  {
    variants: {
      size: {
        default: 'min-h-[80px] px-3 py-2 text-sm',
        sm: 'min-h-[60px] px-2 py-1.5 text-xs',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface WidgetTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof widgetTextareaVariants> {
  /** Autocomplete hint for browser */
  autoComplete?: string;
}

const WidgetTextarea = React.forwardRef<HTMLTextAreaElement, WidgetTextareaProps>(
  ({ className, size, autoComplete, ...props }, ref) => {
    return (
      <textarea
        className={cn(widgetTextareaVariants({ size, className }))}
        autoComplete={autoComplete}
        ref={ref}
        {...props}
      />
    );
  }
);
WidgetTextarea.displayName = 'WidgetTextarea';

export { WidgetTextarea, widgetTextareaVariants };
