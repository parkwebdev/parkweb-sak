import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';

export interface PlanLimits {
  max_agents: number;
  max_conversations_per_month: number;
  max_api_calls_per_month: number;
  max_knowledge_sources: number;
  max_team_members: number;
  max_webhooks: number;
}

export interface CurrentUsage {
  agents: number;
  conversations_this_month: number;
  api_calls_this_month: number;
  knowledge_sources: number;
  team_members: number;
}

export interface LimitCheck {
  allowed: boolean;
  current: number;
  limit: number;
  percentage: number;
  isNearLimit: boolean; // 80% or more
  isAtLimit: boolean; // 100% or more
}

export const usePlanLimits = () => {
  const { user } = useAuth();
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [usage, setUsage] = useState<CurrentUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [planName, setPlanName] = useState<string>('Free');

  useEffect(() => {
    if (user?.id) {
      fetchLimitsAndUsage();
    }
  }, [user?.id]);

  const fetchLimitsAndUsage = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Get subscription and plan limits
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('plan_id, plans(name, limits)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (subError && subError.code !== 'PGRST116') throw subError;

      // Unlimited plan (owner account - no restrictions)
      let planLimits: PlanLimits = {
        max_agents: 999999,
        max_conversations_per_month: 999999,
        max_api_calls_per_month: 999999,
        max_knowledge_sources: 999999,
        max_team_members: 999999,
        max_webhooks: 999999,
      };

      let currentPlanName = 'Free';

      if (subscription?.plans) {
        const plan = subscription.plans as any;
        currentPlanName = plan.name || 'Free';
        const storedLimits = plan.limits as any;
        if (storedLimits) {
          planLimits = {
            max_agents: storedLimits.max_agents || 1,
            max_conversations_per_month: storedLimits.max_conversations_per_month || 100,
            max_api_calls_per_month: storedLimits.max_api_calls_per_month || 1000,
            max_knowledge_sources: storedLimits.max_knowledge_sources || 10,
            max_team_members: storedLimits.max_team_members || 1,
            max_webhooks: storedLimits.max_webhooks || 0,
          };
        }
      }

      setPlanName(currentPlanName);
      setLimits(planLimits);

      // Get current usage
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Count agents
      const { count: agentsCount } = await supabase
        .from('agents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Count conversations this month
      const { count: conversationsCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', firstDayOfMonth.toISOString());

      // Count knowledge sources
      const { count: knowledgeCount } = await supabase
        .from('knowledge_sources')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Count team members (where current user is the owner)
      const { count: teamCount } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id);

      // Get API calls from usage metrics
      const { data: usageMetrics } = await supabase
        .from('usage_metrics')
        .select('api_calls_count')
        .eq('user_id', user.id)
        .gte('period_start', firstDayOfMonth.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setUsage({
        agents: agentsCount || 0,
        conversations_this_month: conversationsCount || 0,
        api_calls_this_month: usageMetrics?.api_calls_count || 0,
        knowledge_sources: knowledgeCount || 0,
        team_members: teamCount || 0,
      });
    } catch (error) {
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
    if (!limits || !usage) {
      return {
        allowed: false,
        current: 0,
        limit: 0,
        percentage: 0,
        isNearLimit: false,
        isAtLimit: true,
      };
    }

    const limitMap: Record<keyof CurrentUsage, number> = {
      agents: limits.max_agents,
      conversations_this_month: limits.max_conversations_per_month,
      api_calls_this_month: limits.max_api_calls_per_month,
      knowledge_sources: limits.max_knowledge_sources,
      team_members: limits.max_team_members,
    };

    const current = usage[resourceType];
    const limit = limitMap[resourceType];
    const newTotal = current + additionalCount;
    const percentage = (newTotal / limit) * 100;

    return {
      allowed: newTotal <= limit,
      current: newTotal,
      limit,
      percentage: Math.min(percentage, 100),
      isNearLimit: percentage >= 80,
      isAtLimit: percentage >= 100,
    };
  };

  const canCreateAgent = (): LimitCheck => {
    return checkLimit('agents', 1);
  };

  const canAddKnowledgeSource = (): LimitCheck => {
    return checkLimit('knowledge_sources', 1);
  };

  const canAddTeamMember = (): LimitCheck => {
    return checkLimit('team_members', 1);
  };

  const showLimitWarning = (
    resourceType: string,
    check: LimitCheck,
    action: string = 'create'
  ) => {
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

  return {
    limits,
    usage,
    loading,
    planName,
    checkLimit,
    canCreateAgent,
    canAddKnowledgeSource,
    canAddTeamMember,
    showLimitWarning,
    refetch: fetchLimitsAndUsage,
  };
};
