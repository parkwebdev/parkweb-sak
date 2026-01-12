/**
 * Audit action type constants
 * 
 * @module lib/admin/audit-actions
 */

import type { AuditAction, AuditTargetType } from '@/types/admin';

/**
 * All available audit action types with display labels
 */
export const AUDIT_ACTIONS: Record<AuditAction, { label: string; description: string }> = {
  impersonation_start: {
    label: 'Impersonation Started',
    description: 'Admin started impersonating a user account',
  },
  impersonation_end: {
    label: 'Impersonation Ended',
    description: 'Admin ended impersonation session',
  },
  account_suspend: {
    label: 'Account Suspended',
    description: 'User account was suspended',
  },
  account_activate: {
    label: 'Account Activated',
    description: 'User account was activated',
  },
  account_delete: {
    label: 'Account Deleted',
    description: 'User account was permanently deleted',
  },
  config_update: {
    label: 'Config Updated',
    description: 'Platform configuration was updated',
  },
  plan_create: {
    label: 'Plan Created',
    description: 'New subscription plan was created',
  },
  plan_update: {
    label: 'Plan Updated',
    description: 'Subscription plan was modified',
  },
  plan_delete: {
    label: 'Plan Deleted',
    description: 'Subscription plan was deleted',
  },
  team_invite: {
    label: 'Team Invite',
    description: 'New team member was invited',
  },
  team_remove: {
    label: 'Team Removed',
    description: 'Team member was removed',
  },
  article_create: {
    label: 'Article Created',
    description: 'Help article was created',
  },
  article_update: {
    label: 'Article Updated',
    description: 'Help article was modified',
  },
  article_delete: {
    label: 'Article Deleted',
    description: 'Help article was deleted',
  },
  category_create: {
    label: 'Category Created',
    description: 'Help category was created',
  },
  category_update: {
    label: 'Category Updated',
    description: 'Help category was modified',
  },
  category_delete: {
    label: 'Category Deleted',
    description: 'Help category was deleted',
  },
  email_send: {
    label: 'Email Sent',
    description: 'Email was sent to user(s)',
  },
  announcement_send: {
    label: 'Announcement Sent',
    description: 'Feature announcement was sent',
  },
} as const;

/**
 * Target types with display labels
 */
export const AUDIT_TARGET_TYPES: Record<AuditTargetType, string> = {
  account: 'Account',
  config: 'Configuration',
  plan: 'Plan',
  team: 'Team Member',
  article: 'Article',
  category: 'Category',
  email: 'Email',
} as const;

/**
 * Get display label for an audit action
 */
export function getAuditActionLabel(action: AuditAction): string {
  return AUDIT_ACTIONS[action]?.label ?? action;
}

/**
 * Get description for an audit action
 */
export function getAuditActionDescription(action: AuditAction): string {
  return AUDIT_ACTIONS[action]?.description ?? '';
}

/**
 * Get display label for a target type
 */
export function getTargetTypeLabel(targetType: AuditTargetType | null): string {
  if (!targetType) return 'Unknown';
  return AUDIT_TARGET_TYPES[targetType] ?? targetType;
}
