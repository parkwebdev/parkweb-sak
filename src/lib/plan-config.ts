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
 * Ordered by tier introduction: Starter → Business → Advanced
 */
export const PLAN_FEATURES: FeatureConfig[] = [
  // Starter tier features (foundational)
  { key: 'widget', label: 'Chat Widget', description: 'Embed a chat bubble on your website that visitors can use to talk with your AI agent.', category: 'Core' },
  { key: 'knowledge_sources', label: 'Knowledge Sources', description: 'Upload documents, PDFs, or website URLs to train your AI on your specific business information.', category: 'Knowledge' },
  { key: 'calendar_booking', label: 'Calendar Booking', description: 'Let your AI agent schedule appointments directly into your connected calendar.', category: 'Knowledge' },
  // Business tier features (growth)
  { key: 'locations', label: 'Locations', description: 'Manage multiple business locations with separate knowledge, hours, and booking calendars.', category: 'Knowledge' },
  { key: 'integrations', label: 'Integrations', description: 'Connect social media, email, and calendar platforms to centralize your conversations.', category: 'Tools' },
  { key: 'advanced_analytics', label: 'Advanced Analytics', description: 'Deep insights into conversation performance, visitor behavior, and conversion metrics.', category: 'Analytics' },
  { key: 'report_builder', label: 'Report Builder', description: 'Create custom reports with the metrics and visualizations you need.', category: 'Analytics' },
  // Advanced tier features (enterprise)
  { key: 'webhooks', label: 'Webhooks', description: 'Receive real-time HTTP notifications when events occur in your account.', category: 'Core' },
  { key: 'custom_tools', label: 'Custom Tools', description: 'Connect external APIs so your AI can perform actions like checking inventory or updating CRMs.', category: 'Tools' },
  { key: 'scheduled_reports', label: 'Scheduled Reports', description: 'Automatically email reports on a daily, weekly, or monthly schedule.', category: 'Analytics' },
];

/**
 * All 5 enforced limits that can be set per plan.
 * Uses max_* naming convention to match database keys.
 */
export const PLAN_LIMITS: LimitConfig[] = [
  { key: 'max_conversations_per_month', label: 'Conversations/Month', displayLabel: 'conversations/mo', description: 'A conversation is a complete chat session with a visitor. Each new visitor or returning visitor after 24 hours counts as one conversation.' },
  { key: 'max_knowledge_sources', label: 'Knowledge Sources', displayLabel: 'knowledge sources', description: 'Documents, URLs, or files that train your AI agent. Each uploaded file or website link counts as one source.' },
  { key: 'max_team_members', label: 'Team Members', displayLabel: 'team members', description: 'Additional users who can access your account, view conversations, and manage your AI agent.' },
  { key: 'max_webhooks', label: 'Webhooks', displayLabel: 'webhooks', description: 'Endpoints that receive real-time notifications when events occur, like new leads or completed bookings.' },
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

/** Helper map for feature descriptions (customer-facing) */
export const FEATURE_DESCRIPTIONS = Object.fromEntries(
  PLAN_FEATURES.map(f => [f.key, f.description])
) as Record<string, string>;

/** Helper map for limit descriptions (customer-facing) */
export const LIMIT_DESCRIPTIONS = Object.fromEntries(
  PLAN_LIMITS.map(l => [l.key, l.description])
) as Record<string, string>;

/** Centralized category color tokens for consistent styling across all feature displays */
export const FEATURE_CATEGORY_COLORS = {
  Core: {
    bg: 'bg-info/10',
    text: 'text-info',
    border: 'border-info/20',
    dot: 'bg-info',
  },
  Tools: {
    bg: 'bg-accent-purple/10',
    text: 'text-accent-purple',
    border: 'border-accent-purple/20',
    dot: 'bg-accent-purple',
  },
  Knowledge: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    border: 'border-warning/20',
    dot: 'bg-warning',
  },
  Analytics: {
    bg: 'bg-status-active/10',
    text: 'text-status-active',
    border: 'border-status-active/20',
    dot: 'bg-status-active',
  },
} as const;

export type FeatureCategory = keyof typeof FEATURE_CATEGORY_COLORS;
