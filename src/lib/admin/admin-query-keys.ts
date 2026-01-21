/**
 * React Query keys for admin queries
 * 
 * Centralized query key factory for type-safe cache management.
 * 
 * @module lib/admin/admin-query-keys
 */

import type { AdminAccountFilters, AuditLogFilters } from '@/types/admin';

export const adminQueryKeys = {
  // Root key for all admin queries
  all: ['admin'] as const,

  // Accounts
  accounts: {
    all: () => [...adminQueryKeys.all, 'accounts'] as const,
    list: (filters: Partial<AdminAccountFilters>, page: number, pageSize: number) =>
      [...adminQueryKeys.accounts.all(), 'list', JSON.stringify(filters), page, pageSize] as const,
    detail: (userId: string) => [...adminQueryKeys.accounts.all(), 'detail', userId] as const,
    usage: (userId: string) => [...adminQueryKeys.accounts.all(), 'usage', userId] as const,
  },

  // Subscriptions
  subscriptions: {
    all: () => [...adminQueryKeys.all, 'subscriptions'] as const,
    list: (filters: Record<string, unknown>) =>
      [...adminQueryKeys.subscriptions.all(), 'list', filters] as const,
  },

  // Plans
  plans: {
    all: () => [...adminQueryKeys.all, 'plans'] as const,
    list: () => [...adminQueryKeys.plans.all(), 'list'] as const,
    detail: (planId: string) => [...adminQueryKeys.plans.all(), 'detail', planId] as const,
  },

  // Platform config
  config: {
    all: () => [...adminQueryKeys.all, 'config'] as const,
    byKey: (key: string) => [...adminQueryKeys.config.all(), key] as const,
  },

  // Team
  team: {
    all: () => [...adminQueryKeys.all, 'team'] as const,
    list: () => [...adminQueryKeys.team.all(), 'list'] as const,
    member: (userId: string) => [...adminQueryKeys.team.all(), 'member', userId] as const,
  },

  // Articles
  articles: {
    all: () => [...adminQueryKeys.all, 'articles'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...adminQueryKeys.articles.all(), 'list', filters] as const,
    detail: (articleId: string) => [...adminQueryKeys.articles.all(), 'detail', articleId] as const,
  },

  // Categories
  categories: {
    all: () => [...adminQueryKeys.all, 'categories'] as const,
    list: () => [...adminQueryKeys.categories.all(), 'list'] as const,
  },

  // Email templates
  emails: {
    all: () => [...adminQueryKeys.all, 'emails'] as const,
    templates: () => [...adminQueryKeys.emails.all(), 'templates'] as const,
    template: (templateId: string) => [...adminQueryKeys.emails.all(), 'template', templateId] as const,
    deliveryLogs: (filters?: Record<string, unknown>) =>
      [...adminQueryKeys.emails.all(), 'delivery-logs', JSON.stringify(filters)] as const,
    deliveryStats: () => [...adminQueryKeys.emails.all(), 'delivery-stats'] as const,
  },

  // Revenue analytics
  revenue: {
    all: () => [...adminQueryKeys.all, 'revenue'] as const,
    analytics: (dateRange: { from: string; to: string }) =>
      [...adminQueryKeys.revenue.all(), 'analytics', dateRange.from, dateRange.to] as const,
    mrr: () => [...adminQueryKeys.revenue.all(), 'mrr'] as const,
  },

  // Audit logs
  audit: {
    all: () => [...adminQueryKeys.all, 'audit'] as const,
    list: (filters: Partial<AuditLogFilters>, page: number, pageSize: number) =>
      [...adminQueryKeys.audit.all(), 'list', JSON.stringify(filters), page, pageSize] as const,
    entry: (entryId: string) => [...adminQueryKeys.audit.all(), 'entry', entryId] as const,
    relatedActivity: (targetId: string, targetType: string | null) =>
      [...adminQueryKeys.audit.all(), 'related', targetId, targetType] as const,
  },

  // Impersonation
  impersonation: {
    all: () => [...adminQueryKeys.all, 'impersonation'] as const,
    current: () => [...adminQueryKeys.impersonation.all(), 'current'] as const,
    sessions: () => [...adminQueryKeys.impersonation.all(), 'sessions'] as const,
  },

  // Platform Help Center
  platformHC: {
    all: () => [...adminQueryKeys.all, 'platformHC'] as const,
    articles: () => [...adminQueryKeys.platformHC.all(), 'articles'] as const,
    article: (articleId: string) => [...adminQueryKeys.platformHC.all(), 'article', articleId] as const,
    categories: () => [...adminQueryKeys.platformHC.all(), 'categories'] as const,
  },
} as const;
