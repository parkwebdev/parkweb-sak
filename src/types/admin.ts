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
  role: string;
  status: 'active' | 'suspended' | 'pending';
  plan_name: string | null;
  subscription_status: string | null;
  mrr: number;
  agent_count: number;
  conversation_count: number;
  lead_count: number;
}

export interface AdminAccountFilters {
  search: string;
  planId?: string;
  status: 'all' | 'active' | 'suspended' | 'pending';
  sortBy: 'created_at' | 'last_active' | 'mrr' | 'display_name';
  sortOrder: 'asc' | 'desc';
}

export interface AdminAccountDetail extends AdminAccount {
  company_address: string | null;
  company_phone: string | null;
  knowledge_source_count: number;
  location_count: number;
  last_login_at: string | null;
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

export interface PlanFeatures {
  [key: string]: boolean;
}

export interface PlanLimits {
  agents?: number;
  conversations_per_month?: number;
  knowledge_sources?: number;
  team_members?: number;
  api_requests_per_day?: number;
  [key: string]: number | undefined;
}

// Team types
export interface PilotTeamMember {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  last_login_at: string | null;
  audit_action_count: number;
}

// Article types for admin
export interface AdminArticle {
  id: string;
  title: string;
  content: string;
  category_id: string;
  category_name: string;
  agent_id: string;
  agent_name: string | null;
  icon: string | null;
  featured_image: string | null;
  order_index: number | null;
  created_at: string;
  updated_at: string;
}

export interface AdminCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  order_index: number | null;
  article_count: number;
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
  | 'account_suspend'
  | 'account_activate'
  | 'account_delete'
  | 'config_update'
  | 'plan_create'
  | 'plan_update'
  | 'plan_delete'
  | 'team_invite'
  | 'team_remove'
  | 'article_create'
  | 'article_update'
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
  | 'email';

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
