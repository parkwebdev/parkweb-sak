/**
 * Admin-specific TypeScript types
 * 
 * @module types/admin
 */

import type { Database } from '@/integrations/supabase/types';

// Database table types
export type PlatformConfig = Database['public']['Tables']['platform_config']['Row'];
export type AdminAuditLog = Database['public']['Tables']['admin_audit_log']['Row'];
export type EmailDeliveryLog = Database['public']['Tables']['email_delivery_logs']['Row'];
export type ImpersonationSession = Database['public']['Tables']['impersonation_sessions']['Row'];

// Account types for admin views
export interface AdminAccount {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  company_name: string | null;
  avatar_url: string | null;
  created_at: string;
  last_login_at: string | null;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  plan_name: string | null;
  subscription_status: string | null;
  mrr: number;
  lead_count: number;
}

export interface AdminAccountFilters {
  search: string;
  planId?: string;
  status: 'all' | 'active' | 'inactive' | 'suspended';
  sortBy: 'created_at' | 'last_login_at' | 'mrr' | 'display_name';
  sortOrder: 'asc' | 'desc';
}

export interface AdminAccountDetail extends AdminAccount {
  company_address: string | null;
  company_phone: string | null;
  knowledge_source_count: number;
  location_count: number;
  permissions: string[];
}

// Subscription types
export interface AdminSubscription {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  plan_id: string;
  plan_name: string;
  status: string;
  stripe_subscription_id: string | null;
  current_period_start: string;
  current_period_end: string;
  mrr: number;
  created_at: string;
  canceled_at: string | null;
}

// Plan types
export interface AdminPlan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  active: boolean;
  features: PlanFeatures;
  limits: PlanLimits;
  created_at: string;
  updated_at: string;
  subscriber_count?: number;
  mrr?: number;
}

/**
 * Plan features - matches actual database keys.
 * Only includes features that are actually implemented and enforced.
 */
export interface PlanFeatures {
  widget?: boolean;
  hosted_page?: boolean;
  api?: boolean;
  webhooks?: boolean;
  white_label?: boolean;
  advanced_analytics?: boolean;
  priority_support?: boolean;
  [key: string]: boolean | undefined;
}

/**
 * Plan limits - uses max_* naming convention to match database.
 * Single-agent model: no agents limit (each account gets exactly one).
 */
export interface PlanLimits {
  max_conversations_per_month?: number;
  max_knowledge_sources?: number;
  max_team_members?: number;
  max_api_calls_per_month?: number;
  max_webhooks?: number;
  [key: string]: number | undefined;
}

// Pilot team specific roles
export type PilotTeamRole = 'super_admin' | 'pilot_support';

// Admin dashboard permissions (different from customer AppPermission)
export type AdminPermission =
  | 'view_accounts'
  | 'manage_accounts'
  | 'view_team'
  | 'manage_team'
  | 'view_content'
  | 'manage_content'
  | 'view_revenue'
  | 'view_settings'
  | 'manage_settings'
  | 'impersonate_users';

export const ADMIN_PERMISSION_GROUPS: Record<string, readonly AdminPermission[]> = {
  'Accounts': ['view_accounts', 'manage_accounts'],
  'Pilot Team': ['view_team', 'manage_team'],
  'Content': ['view_content', 'manage_content'],
  'Revenue': ['view_revenue'],
  'Settings': ['view_settings', 'manage_settings'],
  'Impersonation': ['impersonate_users'],
} as const;

export const DEFAULT_PILOT_ROLE_PERMISSIONS: Record<PilotTeamRole, AdminPermission[]> = {
  super_admin: [], // Super admins have full access, no need to list
  pilot_support: [
    'view_accounts',
    'view_team',
    'view_content',
    'view_revenue',
    'view_settings',
  ],
};

// Human-readable labels for admin permissions
export const ADMIN_PERMISSION_LABELS: Record<AdminPermission, string> = {
  'view_accounts': 'View customer accounts',
  'manage_accounts': 'Manage accounts (suspend, delete)',
  'view_team': 'View Pilot team members',
  'manage_team': 'Manage Pilot team (invite, remove)',
  'view_content': 'View platform content',
  'manage_content': 'Manage content (articles, templates)',
  'view_revenue': 'View revenue analytics',
  'view_settings': 'View platform settings',
  'manage_settings': 'Manage platform settings',
  'impersonate_users': 'Impersonate customer accounts',
};

/** Human-readable labels for permission groups in the matrix UI */
export const ADMIN_FEATURE_LABELS: Record<string, string> = {
  'Accounts': 'Customer Accounts',
  'Pilot Team': 'Internal Team',
  'Content': 'Help Center & Content',
  'Revenue': 'Revenue Analytics',
  'Settings': 'Platform Settings',
  'Impersonation': 'Account Impersonation',
};

// Pilot invite data
export interface InvitePilotMemberData {
  firstName: string;
  lastName: string;
  email: string;
  role: PilotTeamRole;
  adminPermissions?: AdminPermission[];
}

// Team types
export interface PilotTeamMember {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: PilotTeamRole;
  admin_permissions: AdminPermission[];
  created_at: string | null;
  last_login_at: string | null;
  audit_action_count: number;
}

// Email types
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailDeliveryStats {
  total: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;
}

// Revenue analytics types
export interface RevenueData {
  mrr: number;
  arr: number;
  churnRate: number;
  arpu: number;
  ltv: number;
  trialConversion: number;
  netRevenueRetention: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  mrrHistory: MRRDataPoint[];
  churnHistory: ChurnDataPoint[];
  funnel: FunnelData;
  byPlan: PlanRevenueData[];
  topAccounts: TopAccount[];
  // MRR Movement metrics
  newMRR: number;
  expansionMRR: number;
  contractionMRR: number;
  churnedMRR: number;
  quickRatio: number;
  mrrMovementHistory: MRRMovementDataPoint[];
  // Churn analysis
  churnByPlan: ChurnByPlanData[];
  // Account concentration
  accountConcentration: AccountConcentration;
}

export interface MRRDataPoint {
  date: string;
  mrr: number;
  growth: number;
}

export interface ChurnDataPoint {
  date: string;
  rate: number;
  count: number;
}

export interface FunnelData {
  trials: number;
  active: number;
  churned: number;
  conversionRate: number;
}

export interface PlanRevenueData {
  planId: string;
  planName: string;
  mrr: number;
  percentage: number;
  subscriberCount: number;
}

export interface TopAccount {
  userId: string;
  email: string;
  displayName: string | null;
  companyName: string | null;
  planName: string;
  mrr: number;
  lifetimeValue: number;
}

export interface MRRMovementDataPoint {
  date: string;
  newMRR: number;
  expansionMRR: number;
  contractionMRR: number;
  churnedMRR: number;
  netChange: number;
}

export interface ChurnByPlanData {
  planName: string;
  churnRate: number;
  churnedCount: number;
  totalCount: number;
}

export interface AccountConcentration {
  top10Percent: number;
  top25Percent: number;
}

// Audit log types
export interface AuditLogEntry {
  id: string;
  admin_user_id: string;
  admin_email: string;
  admin_name: string | null;
  action: AuditAction;
  target_type: AuditTargetType | null;
  target_id: string | null;
  target_email: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export type AuditAction =
  | 'impersonation_start'
  | 'impersonation_end'
  | 'impersonation_auto_expired'
  | 'account_view'
  | 'account_suspend'
  | 'account_activate'
  | 'account_delete'
  | 'config_update'
  | 'plan_create'
  | 'plan_update'
  | 'plan_delete'
  | 'team_invite'
  | 'team_remove'
  | 'team_role_change'
  | 'article_create'
  | 'article_update'
  | 'article_publish'
  | 'article_delete'
  | 'category_create'
  | 'category_update'
  | 'category_delete'
  | 'email_send'
  | 'announcement_send';

export type AuditTargetType =
  | 'account'
  | 'config'
  | 'plan'
  | 'team'
  | 'article'
  | 'category'
  | 'email'
  | 'session';

export interface AuditLogFilters {
  action?: AuditAction;
  adminUserId?: string;
  targetType?: AuditTargetType;
  dateRange: {
    from: Date;
    to: Date;
  };
  search: string;
}

// Impersonation types
export interface ImpersonationState {
  isImpersonating: boolean;
  targetUserId: string | null;
  targetUserEmail: string | null;
  targetUserName: string | null;
  sessionId: string | null;
  startedAt: string | null;
}

// Platform config types
export interface BaselinePromptConfig {
  value: string;
  version: number;
  updated_at: string;
  updated_by: string | null;
}

export interface SecurityGuardrails {
  enabled: boolean;
  block_pii: boolean;
  block_prompt_injection: boolean;
}

export interface FeatureFlags {
  beta_features: boolean;
  new_onboarding: boolean;
  [key: string]: boolean;
}

// Pagination types
export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}