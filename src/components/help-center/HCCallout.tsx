/**
 * Help Center Callout
 * 
 * Highlighted callout boxes for tips, warnings, and notes in articles.
 * 
 * @module components/help-center/HCCallout
 */

import { AlertCircle, Lightbulb01, AlertTriangle, File02 } from '@untitledui/icons';
import { cn } from '@/lib/utils';

type CalloutVariant = 'info' | 'tip' | 'warning' | 'note';

interface HCCalloutProps {
  variant?: CalloutVariant;
  title?: string;
  children: React.ReactNode;
}

const variantConfig: Record<CalloutVariant, {
  icon: typeof AlertCircle;
  containerClass: string;
  iconClass: string;
  titleClass: string;
}> = {
  info: {
    icon: AlertCircle,
    containerClass: 'bg-info/10 border-info/30',
    iconClass: 'text-info',
    titleClass: 'text-info',
  },
  tip: {
    icon: Lightbulb01,
    containerClass: 'bg-success/10 border-success/30',
    iconClass: 'text-success',
    titleClass: 'text-success',
  },
  warning: {
    icon: AlertTriangle,
    containerClass: 'bg-warning/10 border-warning/30',
    iconClass: 'text-warning',
    titleClass: 'text-warning',
  },
  note: {
    icon: File02,
    containerClass: 'bg-muted border-border',
    iconClass: 'text-muted-foreground',
    titleClass: 'text-foreground',
  },
};

const defaultTitles: Record<CalloutVariant, string> = {
  info: 'Info',
  tip: 'Tip',
  warning: 'Warning',
  note: 'Note',
};

export function HCCallout({ variant = 'info', title, children }: HCCalloutProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;
  const displayTitle = title ?? defaultTitles[variant];

  return (
    <div 
      className={cn(
        'rounded-lg border p-4 my-4',
        config.containerClass
      )}
      role="note"
    >
      <div className="flex items-start gap-3">
        <Icon 
          size={18} 
          className={cn('flex-shrink-0 mt-0.5', config.iconClass)} 
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <h4 className={cn('text-sm font-medium mb-1', config.titleClass)}>
            {displayTitle}
          </h4>
          <div className="text-sm text-foreground/80">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
