/**
 * @fileoverview Circular progress indicator with percentage display.
 * Supports success, warning, and destructive variants.
 */

import { cn } from '@/lib/utils';

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  showPercentage?: boolean;
  className?: string;
}

export function CircularProgress({
  value,
  size = 80,
  strokeWidth = 6,
  variant = 'default',
  showPercentage = true,
  className,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  const variantColors = {
    default: 'stroke-primary',
    success: 'stroke-status-active',
    warning: 'stroke-warning',
    destructive: 'stroke-destructive',
  };

  const variantTextColors = {
    default: 'text-foreground',
    success: 'text-foreground',
    warning: 'text-warning',
    destructive: 'text-destructive',
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            variantColors[variant],
            'transition-[stroke-dashoffset] duration-500 ease-out'
          )}
        />
      </svg>
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            'text-sm font-semibold tabular-nums',
            variantTextColors[variant]
          )}>
            {Math.round(value)}%
          </span>
        </div>
      )}
    </div>
  );
}
