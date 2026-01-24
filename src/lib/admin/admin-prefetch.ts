/**
 * Admin Prefetch Utilities
 * 
 * Standalone fetch functions that can be used for both 
 * React Query hooks and sidebar prefetching.
 * 
 * @module lib/admin/admin-prefetch
 */

import type { QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminQueryKeys } from './admin-query-keys';
import { PLAN_COLUMNS, PLATFORM_HC_CATEGORY_COLUMNS, PLATFORM_HC_ARTICLE_COLUMNS } from '@/lib/db-selects';
import type { AdminPlan, PlanFeatures, PlanLimits, PilotTeamMember, AdminPermission } from '@/types/admin';
import { fetchAccountsCount } from '@/hooks/admin/useAdminAccountsCount';
import { fetchSubscriptionsCount } from '@/hooks/admin/useAdminSubscriptionsCount';

// ============================================================================
// Fetch Functions (extracted from hooks for reuse)
// ============================================================================

/**
 * Fetch all plans from the database
 */
export async function fetchPlans(): Promise<AdminPlan[]> {
  const { data, error } = await supabase
    .from('plans')
    .select(PLAN_COLUMNS)
    .order('price_monthly', { ascending: true });

  if (error) throw error;

  return (data || []).map((plan) => ({
    id: plan.id,
    name: plan.name,
    price_monthly: plan.price_monthly,
    price_yearly: plan.price_yearly,
    active: plan.active ?? true,
    features: (plan.features as PlanFeatures) || {},
    limits: (plan.limits as PlanLimits) || {},
    created_at: plan.created_at,
    updated_at: plan.updated_at,
  }));
}

/**
 * Fetch pilot team members
 */
export async function fetchTeam(): Promise<PilotTeamMember[]> {
  // Get all super_admin and pilot_support users
  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id, role, admin_permissions, created_at')
    .in('role', ['super_admin', 'pilot_support']);

  if (rolesError) throw rolesError;
  if (!roles || roles.length === 0) return [];

  const userIds = roles.map((r) => r.user_id);

  // Batch fetch profiles AND audit logs in parallel
  const [profilesResult, auditLogsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('user_id, display_name, email, avatar_url, last_login_at')
      .in('user_id', userIds),
    supabase
      .from('admin_audit_log')
      .select('admin_user_id')
      .in('admin_user_id', userIds),
  ]);

  if (profilesResult.error) throw profilesResult.error;

  // Count audit logs locally
  const auditCountMap = new Map<string, number>();
  (auditLogsResult.data || []).forEach((log) => {
    const current = auditCountMap.get(log.admin_user_id) || 0;
    auditCountMap.set(log.admin_user_id, current + 1);
  });

  // Create profile lookup map
  const profileMap = new Map(
    profilesResult.data?.map((p) => [p.user_id, p]) || []
  );

  // Map synchronously
  return roles.map((role) => {
    const profile = profileMap.get(role.user_id);
    return {
      id: role.user_id,
      user_id: role.user_id,
      email: profile?.email || '',
      display_name: profile?.display_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      role: role.role as PilotTeamMember['role'],
      admin_permissions: (role.admin_permissions || []) as AdminPermission[],
      created_at: role.created_at,
      last_login_at: profile?.last_login_at ?? null,
      audit_action_count: auditCountMap.get(role.user_id) || 0,
    };
  });
}

/**
 * Fetch platform help center categories
 */
export async function fetchPlatformHCCategories() {
  const { data, error } = await supabase
    .from('platform_hc_categories')
    .select(PLATFORM_HC_CATEGORY_COLUMNS)
    .order('order_index', { ascending: true });
  
  if (error) throw error;
  return data;
}

/**
 * Fetch platform help center articles
 */
export async function fetchPlatformHCArticles() {
  const { data, error } = await supabase
    .from('platform_hc_articles')
    .select(PLATFORM_HC_ARTICLE_COLUMNS)
    .order('order_index', { ascending: true });
  
  if (error) throw error;
  return data;
}

/**
 * Get default date range for revenue analytics (normalized to date-only).
 * Matches the format used in useRevenueAnalytics to ensure cache hits.
 */
function getDefaultDateRange() {
  const now = new Date();
  const from = new Date(now);
  from.setMonth(from.getMonth() - 12);
  return {
    from: from.toISOString().split('T')[0],
    to: now.toISOString().split('T')[0],
  };
}

/**
 * Fetch revenue analytics data.
 */
async function fetchRevenueAnalytics() {
  // TODO: Implement actual revenue analytics from Stripe/subscriptions
  // For now, return placeholder data matching the hook's return type
  return {
    mrr: 0,
    arr: 0,
    churnRate: 0,
    arpu: 0,
    ltv: 0,
    trialConversion: 0,
    netRevenueRetention: 100,
    activeSubscriptions: 0,
    trialSubscriptions: 0,
    mrrHistory: [],
    churnHistory: [],
    funnel: { trials: 0, active: 0, churned: 0, conversionRate: 0 },
    byPlan: [],
    topAccounts: [],
    newMRR: 0,
    expansionMRR: 0,
    contractionMRR: 0,
    churnedMRR: 0,
    quickRatio: 0,
    mrrMovementHistory: [],
    churnByPlan: [],
    accountConcentration: { top10Percent: 0, top25Percent: 0 },
  };
}

// ============================================================================
// Prefetch Map (admin routes → data to prefetch)
// ============================================================================

/**
 * Chunk prefetch mapping - admin paths to their lazy imports
 */
export const prefetchChunk: Record<string, () => Promise<unknown>> = {
  '/admin': () => import('@/pages/admin/AdminDashboard'),
  '/admin/accounts': () => import('@/pages/admin/AdminAccounts'),
  '/admin/prompts': () => import('@/pages/admin/AdminPrompts'),
  '/admin/plans': () => import('@/pages/admin/AdminPlans'),
  '/admin/team': () => import('@/pages/admin/AdminTeam'),
  '/admin/knowledge': () => import('@/pages/admin/AdminKnowledge'),
  '/admin/emails': () => import('@/pages/admin/AdminEmails'),
  '/admin/analytics': () => import('@/pages/admin/AdminRevenue'),
  '/admin/audit': () => import('@/pages/admin/AdminAuditLog'),
};

/**
 * Prefetch admin route data on hover
 * 
 * This prefetches both the JS chunk and the data for the page.
 * Called from AdminSidebar on mouse enter.
 */
export function prefetchAdminRoute(queryClient: QueryClient, path: string) {
  // 1. Always prefetch the chunk
  prefetchChunk[path]?.();

  // 2. Prefetch relevant data based on route
  switch (path) {
    case '/admin/plans':
      queryClient.prefetchQuery({
        queryKey: adminQueryKeys.plans.list(),
        queryFn: fetchPlans,
        staleTime: 60_000,
      });
      break;

    case '/admin/team':
      queryClient.prefetchQuery({
        queryKey: adminQueryKeys.team.list(),
        queryFn: fetchTeam,
        staleTime: 60_000,
      });
      break;

    case '/admin/knowledge':
      // Prefetch both categories and articles
      queryClient.prefetchQuery({
        queryKey: adminQueryKeys.platformHC.categories(),
        queryFn: fetchPlatformHCCategories,
        staleTime: 5 * 60_000,
      });
      queryClient.prefetchQuery({
        queryKey: adminQueryKeys.platformHC.articles(),
        queryFn: fetchPlatformHCArticles,
        staleTime: 5 * 60_000,
      });
      break;

    // Accounts, Audit, Emails require filters/pagination - 
    // only prefetch chunks for these (data depends on user filters)
    case '/admin/accounts':
    case '/admin/audit':
    case '/admin/emails':
    case '/admin/analytics':
    case '/admin/prompts':
      // Just chunk prefetch (already done above)
      break;

    case '/admin':
    default:
      // Prefetch dashboard summary data
      queryClient.prefetchQuery({
        queryKey: adminQueryKeys.accounts.count(),
        queryFn: fetchAccountsCount,
        staleTime: 60_000,
      });
      queryClient.prefetchQuery({
        queryKey: adminQueryKeys.subscriptions.count(),
        queryFn: fetchSubscriptionsCount,
        staleTime: 60_000,
      });
      queryClient.prefetchQuery({
        queryKey: adminQueryKeys.revenue.analytics(getDefaultDateRange()),
        queryFn: fetchRevenueAnalytics,
        staleTime: 300_000,
      });
      break;
  }
}
