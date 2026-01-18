/**
 * Help Center Step-by-Step Component
 * 
 * Displays a numbered list of steps with optional screenshots.
 * 
 * @module components/help-center/HCStepByStep
 */

import { cn } from '@/lib/utils';

interface Step {
  /** Step title */
  title: string;
  /** Step description */
  description?: string;
  /** Optional screenshot URL */
  screenshot?: string;
  /** Screenshot alt text */
  screenshotAlt?: string;
}

interface HCStepByStepProps {
  /** Array of steps */
  steps: Step[];
  /** Optional additional className */
  className?: string;
}

export function HCStepByStep({ steps, className }: HCStepByStepProps) {
  return (
    <div className={cn('my-6 space-y-6', className)}>
      {steps.map((step, index) => (
        <div 
          key={index} 
          className="relative pl-12"
        >
          {/* Step number */}
          <div 
            className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold"
            aria-hidden="true"
          >
            {index + 1}
          </div>
          
          {/* Connector line */}
          {index < steps.length - 1 && (
            <div 
              className="absolute left-[15px] top-8 h-[calc(100%+0.5rem)] w-0.5 bg-border"
              aria-hidden="true"
            />
          )}
          
          {/* Step content */}
          <div className="pt-0.5">
            <h4 className="text-sm font-medium text-foreground mb-1">
              {step.title}
            </h4>
            {step.description && (
              <p className="text-sm text-muted-foreground mb-3">
                {step.description}
              </p>
            )}
            {step.screenshot && (
              <div className="overflow-hidden rounded-lg border border-border bg-muted/30 shadow-sm">
                <img
                  src={step.screenshot}
                  alt={step.screenshotAlt || step.title}
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
