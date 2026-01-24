/**
 * @fileoverview Pill-style billing period toggle component.
 * Matches the Time2book reference design with a segmented button appearance.
 */

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface BillingToggleProps {
  value: 'monthly' | 'yearly';
  onChange: (value: 'monthly' | 'yearly') => void;
  className?: string;
}

export function BillingToggle({ value, onChange, className }: BillingToggleProps) {
  return (
    <div className={cn("inline-flex bg-muted rounded-lg p-1", className)}>
      <button
        type="button"
        onClick={() => onChange('monthly')}
        className={cn(
          "px-4 py-2 text-sm font-medium rounded-md transition-colors",
          value === 'monthly' 
            ? "bg-background shadow-sm text-foreground" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Pay monthly
      </button>
      <button
        type="button"
        onClick={() => onChange('yearly')}
        className={cn(
          "px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2",
          value === 'yearly' 
            ? "bg-background shadow-sm text-foreground" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Pay yearly
        <Badge 
          variant="secondary" 
          className="bg-savings text-savings-foreground border-0 text-xs font-medium"
        >
          Save 20%
        </Badge>
      </button>
    </div>
  );
}
