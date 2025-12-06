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
            <div key={index} className="flex gap-3">
              {/* Indicator column */}
              <div className="flex flex-col items-center">
                {/* Icon circle */}
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                    isComplete && "bg-primary border-primary text-primary-foreground",
                    isCurrent && "border-primary bg-primary/10 text-primary",
                    !isComplete && !isCurrent && "border-border bg-background text-muted-foreground"
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
                      "w-0.5 flex-1 min-h-[3rem] transition-colors",
                      index < currentStep ? "bg-primary" : "bg-border"
                    )}
                  />
                )}
              </div>

              {/* Text content */}
              <div className="pb-8 pt-2">
                <p
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isComplete || isCurrent ? "text-foreground" : "text-muted-foreground"
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
