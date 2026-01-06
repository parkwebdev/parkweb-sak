/**
 * Shared Priority Configuration
 * 
 * Single source of truth for priority styling across:
 * - LeadDetailsSheet (dropdown)
 * - ConversationMetadataPanel (dropdown)
 * - LeadsKanbanBoard (badges)
 * - LeadActivityPanel (activity badges)
 * 
 * @verified 2026-01-03
 */

export const PRIORITY_CONFIG = {
  none: {
    label: 'Not Set',
    value: 'none',
    dotColor: 'bg-muted',
    badgeClass: 'bg-muted text-muted-foreground border-border',
  },
  low: {
    label: 'Low',
    value: 'low',
    dotColor: 'bg-success',
    badgeClass: 'bg-success/10 text-success border-success/20',
  },
  normal: {
    label: 'Normal',
    value: 'normal',
    dotColor: 'bg-info',
    badgeClass: 'bg-info/10 text-info border-info/20',
  },
  high: {
    label: 'High',
    value: 'high',
    dotColor: 'bg-warning',
    badgeClass: 'bg-warning/10 text-warning border-warning/20',
  },
  urgent: {
    label: 'Urgent',
    value: 'urgent',
    dotColor: 'bg-destructive',
    badgeClass: 'bg-destructive/10 text-destructive border-destructive/20',
  },
} as const;

export type PriorityValue = keyof typeof PRIORITY_CONFIG;

/**
 * Priority options array for Select dropdowns
 * Use this in LeadDetailsSheet and ConversationMetadataPanel
 */
export const PRIORITY_OPTIONS = Object.entries(PRIORITY_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
  dotColor: config.dotColor,
}));

/**
 * Map ConversationMetadata priority values (including 'not_set') to our config
 * 'not_set' from DB maps to 'none' in our config
 */
export function normalizePriority(priority: string | undefined | null): PriorityValue {
  if (!priority || priority === 'not_set') return 'none';
  if (priority in PRIORITY_CONFIG) return priority as PriorityValue;
  return 'none';
}
