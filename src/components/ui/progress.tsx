/**
 * Progress Component
 * 
 * A visual indicator for progress or loading states with multiple
 * variants, optional labels, and animation support.
 * 
 * @module components/ui/progress
 * 
 * @example
 * ```tsx
 * <Progress value={75} />
 * <Progress value={50} showLabel variant="success" />
 * <Progress value={25} animated />
 * ```
 */
import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number;
  showLabel?: boolean;
  labelPosition?: "left" | "right";
  formatLabel?: (value: number) => string;
  variant?: "default" | "success" | "warning" | "destructive";
  animated?: boolean;
}

const indicatorVariants = {
  default: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
};

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, showLabel, labelPosition = "right", formatLabel, variant = "default", animated = false, ...props }, ref) => {
  const displayValue = value || 0;
  const formattedLabel = formatLabel ? formatLabel(displayValue) : `${displayValue.toFixed(1)}%`;
  const indicatorClass = indicatorVariants[variant];
  
  const animatedClass = animated 
    ? "bg-[length:200%_100%] bg-gradient-to-r from-[hsl(var(--success))] via-[hsl(var(--success)/0.6)] to-[hsl(var(--success))] animate-progress-shimmer" 
    : "";

  if (showLabel) {
    return (
      <div className={cn("flex items-center gap-3", labelPosition === "left" && "flex-row-reverse")}>
        <ProgressPrimitive.Root
          ref={ref}
          className={cn(
            "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
            className
          )}
          {...props}
        >
          <ProgressPrimitive.Indicator
            className={cn("h-full w-full flex-1 transition-all", animated ? animatedClass : indicatorClass)}
            style={{ transform: `translateX(-${100 - displayValue}%)` }}
          />
        </ProgressPrimitive.Root>
        <span className="shrink-0 text-sm tabular-nums text-muted-foreground min-w-[3rem] text-right">
          {formattedLabel}
        </span>
      </div>
    );
  }

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full w-full flex-1 transition-all", animated ? animatedClass : indicatorClass)}
        style={{ transform: `translateX(-${100 - displayValue}%)` }}
      />
    </ProgressPrimitive.Root>
  );
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }