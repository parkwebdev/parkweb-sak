import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAccountOwnerId } from '@/hooks/useAccountOwnerId';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';
import type { PlanLimits as PlanLimitsType, PlanFeatures as PlanFeaturesType } from '@/types/metadata';

/**
 * Hook for checking subscription plan limits, features, and current usage.
 * Database is the single source of truth - no hardcoded fallbacks.
 * 
 * @returns {Object} Plan limits, features, and usage data
 */

export interface PlanLimits {
  max_conversations_per_month?: number;
  max_knowledge_sources?: number;
  max_team_members?: number;
  max_webhooks?: number;
}

export interface PlanFeatures {
  // Core
  widget?: boolean;
  webhooks?: boolean;
  // Tools
  custom_tools?: boolean;
  integrations?: boolean;
  // Knowledge & Locations
  knowledge_sources?: boolean;
  locations?: boolean;
  calendar_booking?: boolean;
  // Analytics & Reporting
  advanced_analytics?: boolean;
  report_builder?: boolean;
  scheduled_reports?: boolean;
}

export interface CurrentUsage {
  conversations_this_month: number;
  knowledge_sources: number;
  team_members: number;
  webhooks: number;
}

export interface LimitCheck {
  allowed: boolean;
  current: number;
  limit: number | null; // null means unlimited
  percentage: number;
  isNearLimit: boolean; // 80% or more
  isAtLimit: boolean; // 100% or more
  isUnlimited: boolean;
}

export const usePlanLimits = () => {
  const { user } = useAuth();
  const { accountOwnerId, loading: ownerLoading } = useAccountOwnerId();
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [features, setFeatures] = useState<PlanFeatures | null>(null);
  const [usage, setUsage] = useState<CurrentUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [planName, setPlanName] = useState<string | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  useEffect(() => {
    if (accountOwnerId && !ownerLoading) {
      fetchLimitsAndUsage();
    }
  }, [accountOwnerId, ownerLoading]);

  const fetchLimitsAndUsage = async () => {
    if (!accountOwnerId) return;

    setLoading(true);
    try {
      // Get subscription, plan limits, and features (always from account owner)
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('plan_id, plans(name, limits, features)')
        .eq('user_id', accountOwnerId)
        .eq('status', 'active')
        .maybeSingle();

      if (subError && subError.code !== 'PGRST116') throw subError;

      if (!subscription?.plans) {
        // No active subscription - no limits/features available
        setHasActiveSubscription(false);
        setPlanName(null);
        setLimits(null);
        setFeatures(null);
        setUsage(null);
        setLoading(false);
        return;
      }

      setHasActiveSubscription(true);
      const plan = subscription.plans as { name?: string; limits?: PlanLimitsType; features?: PlanFeaturesType };
      setPlanName(plan.name || null);
      
      // Set limits
      const storedLimits = plan.limits;
      if (storedLimits) {
        setLimits({
          max_conversations_per_month: storedLimits.max_conversations_per_month,
          max_knowledge_sources: storedLimits.max_knowledge_sources,
          max_team_members: storedLimits.max_team_members,
          max_webhooks: storedLimits.max_webhooks,
        });
      } else {
        setLimits({});
      }

      // Set features
      const storedFeatures = plan.features;
      if (storedFeatures) {
        setFeatures({
          // Core
          widget: storedFeatures.widget === true,
          webhooks: storedFeatures.webhooks === true,
          // Tools
          custom_tools: storedFeatures.custom_tools === true,
          integrations: storedFeatures.integrations === true,
          // Knowledge & Locations
          knowledge_sources: storedFeatures.knowledge_sources === true,
          locations: storedFeatures.locations === true,
          calendar_booking: storedFeatures.calendar_booking === true,
          // Analytics & Reporting
          advanced_analytics: storedFeatures.advanced_analytics === true,
          report_builder: storedFeatures.report_builder === true,
          scheduled_reports: storedFeatures.scheduled_reports === true,
        });
      } else {
        setFeatures({});
      }

      // Get current usage (scoped to account owner)
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Count conversations this month
      const { count: conversationsCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', accountOwnerId)
        .gte('created_at', firstDayOfMonth.toISOString());

      // Count knowledge sources (exclude auto-synced wordpress_home entries)
      const { count: knowledgeCount } = await supabase
        .from('knowledge_sources')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', accountOwnerId)
        .neq('source_type', 'wordpress_home');

      // Count team members (where account owner is the owner)
      const { count: teamCount } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', accountOwnerId);

      // Count webhooks (scoped to account owner)
      const { count: webhooksCount } = await supabase
        .from('webhooks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', accountOwnerId);

      setUsage({
        conversations_this_month: conversationsCount || 0,
        knowledge_sources: knowledgeCount || 0,
        team_members: teamCount || 0,
        webhooks: webhooksCount || 0,
      });
    } catch (error: unknown) {
      logger.error('Error fetching plan limits', error);
      toast.error('Failed to load plan limits');
    } finally {
      setLoading(false);
    }
  };

  const checkLimit = (
    resourceType: keyof CurrentUsage,
    additionalCount: number = 0
  ): LimitCheck => {
    if (!hasActiveSubscription || !usage) {
      return {
        allowed: false,
        current: 0,
        limit: 0,
        percentage: 100,
        isNearLimit: true,
        isAtLimit: true,
        isUnlimited: false,
      };
    }

    const limitMap: Record<keyof CurrentUsage, number | undefined> = {
      conversations_this_month: limits?.max_conversations_per_month,
      knowledge_sources: limits?.max_knowledge_sources,
      team_members: limits?.max_team_members,
      webhooks: limits?.max_webhooks,
    };

    const current = usage[resourceType];
    const limit = limitMap[resourceType];
    
    // undefined or null means unlimited
    if (limit === undefined || limit === null) {
      return {
        allowed: true,
        current: current + additionalCount,
        limit: null,
        percentage: 0,
        isNearLimit: false,
        isAtLimit: false,
        isUnlimited: true,
      };
    }

    const newTotal = current + additionalCount;
    const percentage = limit > 0 ? (newTotal / limit) * 100 : 100;

    return {
      allowed: newTotal <= limit,
      current: newTotal,
      limit,
      percentage: Math.min(percentage, 100),
      isNearLimit: percentage >= 80,
      isAtLimit: percentage >= 100,
      isUnlimited: false,
    };
  };

  const canAddKnowledgeSource = (): LimitCheck => {
    return checkLimit('knowledge_sources', 1);
  };

  const canAddTeamMember = (): LimitCheck => {
    return checkLimit('team_members', 1);
  };

  const canAddWebhook = (): LimitCheck => {
    return checkLimit('webhooks', 1);
  };

  const showLimitWarning = (
    resourceType: string,
    check: LimitCheck,
    action: string = 'create'
  ) => {
    if (check.isUnlimited) return false;
    
    if (!check.allowed) {
      toast.error(
        `Plan limit reached: You can only ${action} ${check.limit} ${resourceType}. Upgrade your plan to continue.`,
        { duration: 5000 }
      );
      return true;
    }

    if (check.isNearLimit) {
      toast.warning(
        `Approaching limit: You've used ${check.current} of ${check.limit} ${resourceType} (${Math.round(check.percentage)}%)`,
        { duration: 4000 }
      );
    }

    return false;
  };

  // Feature checking helpers
  const hasFeature = (feature: keyof PlanFeatures): boolean => {
    if (!hasActiveSubscription || !features) return false;
    return features[feature] === true;
  };

  // Core features
  const canUseWidget = (): boolean => hasFeature('widget');
  const canUseWebhooks = (): boolean => hasFeature('webhooks');
  // Tools features
  const canUseCustomTools = (): boolean => hasFeature('custom_tools');
  const canUseIntegrations = (): boolean => hasFeature('integrations');
  // Knowledge & Locations features
  const canUseKnowledgeSources = (): boolean => hasFeature('knowledge_sources');
  const canUseLocations = (): boolean => hasFeature('locations');
  const canUseCalendarBooking = (): boolean => hasFeature('calendar_booking');
  // Analytics & Reporting features
  const canUseAdvancedAnalytics = (): boolean => hasFeature('advanced_analytics');
  const canUseReportBuilder = (): boolean => hasFeature('report_builder');
  const canUseScheduledReports = (): boolean => hasFeature('scheduled_reports');

  return {
    // Limits
    limits,
    usage,
    checkLimit,
    canAddKnowledgeSource,
    canAddTeamMember,
    canAddWebhook,
    showLimitWarning,
    // Features
    features,
    hasFeature,
    canUseWidget,
    canUseWebhooks,
    canUseCustomTools,
    canUseIntegrations,
    canUseKnowledgeSources,
    canUseLocations,
    canUseCalendarBooking,
    canUseAdvancedAnalytics,
    canUseReportBuilder,
    canUseScheduledReports,
    // Common
    loading,
    planName,
    hasActiveSubscription,
    refetch: fetchLimitsAndUsage,
  };
};