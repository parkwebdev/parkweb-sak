/**
 * Centralized plan feature and limit configuration.
 * Single source of truth for both admin editors and customer display.
 * 
 * @module lib/plan-config
 */

export interface FeatureConfig {
  key: string;
  label: string;
  description: string;
  category: 'Core' | 'Tools' | 'Knowledge' | 'Analytics';
}

export interface LimitConfig {
  key: string;
  label: string;        // For admin editor: "Conversations/Month"
  displayLabel: string; // For customer cards: "conversations/mo"
  description: string;
}

/**
 * All 11 gated features that can be toggled per plan.
 * Order determines display order in both admin and customer UIs.
 */
export const PLAN_FEATURES: FeatureConfig[] = [
  // Core
  { key: 'widget', label: 'Chat Widget', description: 'Embed chat widget on websites', category: 'Core' },
  { key: 'api', label: 'API Access', description: 'Programmatic API access', category: 'Core' },
  { key: 'webhooks', label: 'Webhooks', description: 'Event webhook notifications', category: 'Core' },
  // Tools
  { key: 'custom_tools', label: 'Custom Tools', description: 'External API tool integrations', category: 'Tools' },
  { key: 'integrations', label: 'Integrations', description: 'Social, email & calendar connections', category: 'Tools' },
  // Knowledge
  { key: 'knowledge_sources', label: 'Knowledge Sources', description: 'Document & URL training', category: 'Knowledge' },
  { key: 'locations', label: 'Locations', description: 'Multi-location management', category: 'Knowledge' },
  { key: 'calendar_booking', label: 'Calendar Booking', description: 'AI appointment scheduling', category: 'Knowledge' },
  // Analytics
  { key: 'advanced_analytics', label: 'Advanced Analytics', description: 'Deep performance insights', category: 'Analytics' },
  { key: 'report_builder', label: 'Report Builder', description: 'Custom report generation', category: 'Analytics' },
  { key: 'scheduled_reports', label: 'Scheduled Reports', description: 'Automated email delivery', category: 'Analytics' },
];

/**
 * All 5 enforced limits that can be set per plan.
 * Uses max_* naming convention to match database keys.
 */
export const PLAN_LIMITS: LimitConfig[] = [
  { key: 'max_conversations_per_month', label: 'Conversations/Month', displayLabel: 'conversations/mo', description: 'Monthly conversation limit' },
  { key: 'max_knowledge_sources', label: 'Knowledge Sources', displayLabel: 'knowledge sources', description: 'Max knowledge sources' },
  { key: 'max_team_members', label: 'Team Members', displayLabel: 'team members', description: 'Max team members' },
  { key: 'max_api_calls_per_month', label: 'API Calls/Month', displayLabel: 'API calls/mo', description: 'Monthly API call limit' },
  { key: 'max_webhooks', label: 'Webhooks', displayLabel: 'webhooks', description: 'Max webhook endpoints' },
];

/** Feature categories for grouping in admin UI */
export const FEATURE_CATEGORIES = ['Core', 'Tools', 'Knowledge', 'Analytics'] as const;

/** Helper map for quick label lookup by feature key */
export const FEATURE_LABELS = Object.fromEntries(
  PLAN_FEATURES.map(f => [f.key, f.label])
) as Record<string, string>;

/** Helper map for quick display label lookup by limit key */
export const LIMIT_DISPLAY_LABELS = Object.fromEntries(
  PLAN_LIMITS.map(l => [l.key, l.displayLabel])
) as Record<string, string>;

/** Helper map for quick admin label lookup by limit key */
export const LIMIT_LABELS = Object.fromEntries(
  PLAN_LIMITS.map(l => [l.key, l.label])
) as Record<string, string>;
