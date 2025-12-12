/**
 * StepProgress Component
 * 
 * Vertical step progress indicator with icons and connecting lines.
 * Shows completion status and highlights current step.
 * @module components/ui/step-progress
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "@untitledui/icons";

export interface StepItem {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface StepProgressProps {
  steps: StepItem[];
  currentStep: number;
  className?: string;
}

const StepProgress = React.forwardRef<HTMLDivElement, StepProgressProps>(
  ({ steps, currentStep, className }, ref) => {
    return (
      <div ref={ref} className={cn("flex flex-col", className)}>
        {steps.map((step, index) => {
          const isComplete = index < currentStep;
          const isCurrent = index === currentStep;
          const Icon = step.icon;

          return (
            <div key={index} className="flex gap-4">
              {/* Indicator column */}
              <div className="flex flex-col items-center">
                {/* Icon box */}
                <div
                  className={cn(
                    "flex items-center justify-center w-11 h-11 rounded-lg border transition-colors",
                    isComplete && "border-primary/50 bg-primary/10 text-primary",
                    isCurrent && "border-primary bg-primary/10 text-primary",
                    !isComplete && !isCurrent && "border-border bg-muted/50 text-muted-foreground"
                  )}
                >
                  {isComplete ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                {/* Connecting line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-px flex-1 min-h-[2rem] my-2 transition-colors",
                      index < currentStep ? "bg-primary/50" : "bg-border"
                    )}
                  />
                )}
              </div>

              {/* Text content */}
              <div className="pb-6 pt-2.5">
                <p
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);
StepProgress.displayName = "StepProgress";

export { StepProgress };
