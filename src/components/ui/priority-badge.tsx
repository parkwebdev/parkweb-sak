/**
 * Shared PriorityBadge Component
 * 
 * Reusable priority badge for consistent display across:
 * - LeadsKanbanBoard cards
 * - LeadActivityPanel activity descriptions
 * - LeadsTable (future)
 * 
 * @verified 2026-01-03
 */

import { Badge } from './badge';
import { Flag01 } from '@untitledui/icons';
import { PRIORITY_CONFIG, PriorityValue, normalizePriority } from '@/lib/priority-config';
import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  /** Priority value - handles 'not_set' from DB automatically */
  priority: string | undefined | null;
  /** Badge size - sm (default) or default */
  size?: 'sm' | 'default';
  /** Whether to show the flag icon */
  showIcon?: boolean;
  /** Additional className */
  className?: string;
}

export function PriorityBadge({ 
  priority, 
  size = 'sm', 
  showIcon = true,
  className,
}: PriorityBadgeProps) {
  const normalizedPriority = normalizePriority(priority);
  const config = PRIORITY_CONFIG[normalizedPriority];
  
  // Don't render badge for 'none' priority
  if (normalizedPriority === 'none') {
    return null;
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        size === 'sm' ? 'h-5 text-2xs px-1.5' : 'h-6 text-xs px-2',
        config.badgeClass,
        className
      )}
    >
      {showIcon && <Flag01 size={size === 'sm' ? 10 : 12} className="mr-0.5" />}
      {config.label}
    </Badge>
  );
}
