/**
 * Help Center Feature Highlight Component
 * 
 * Highlights a feature with a bordered card and optional icon.
 * 
 * @module components/help-center/HCFeatureCard
 */

import { cn } from '@/lib/utils';

interface HCFeatureCardProps {
  /** Feature title */
  title: string;
  /** Feature description */
  description: string;
  /** Icon component to display */
  icon?: React.ReactNode;
  /** Optional additional className */
  className?: string;
}

export function HCFeatureCard({ title, description, icon, className }: HCFeatureCardProps) {
  return (
    <div className={cn(
      'rounded-lg border border-border bg-card p-4 shadow-sm',
      className
    )}>
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-foreground mb-1">
            {title}
          </h4>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

interface HCFeatureGridProps {
  /** Children feature cards */
  children: React.ReactNode;
  /** Number of columns (2 or 3) */
  columns?: 2 | 3;
  /** Optional additional className */
  className?: string;
}

export function HCFeatureGrid({ children, columns = 2, className }: HCFeatureGridProps) {
  return (
    <div className={cn(
      'my-6 grid gap-4',
      columns === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      className
    )}>
      {children}
    </div>
  );
}
