/**
 * @fileoverview Minimal plan card matching Time2book reference design.
 * Clean, borderless cards with subtle separators between columns.
 */

import { Check, X, Loading02 } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface PlanData {
  id: string;
  name: string;
  description?: string;
  price_monthly: number;
  price_yearly: number;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  features: Record<string, boolean>;
  limits: Record<string, number>;
}

interface PlanCardProps {
  plan: PlanData;
  billingPeriod: 'monthly' | 'yearly';
  isCurrentPlan?: boolean;
  onSelect: (priceId: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

// Feature labels for display
const FEATURE_LABELS: Record<string, string> = {
  widget: 'Chat Widget',
  api: 'API Access',
  api_access: 'API Access',
  webhooks: 'Webhooks',
  custom_tools: 'Custom Tools',
  integrations: 'Integrations',
  knowledge_sources: 'Knowledge Sources',
  locations: 'Multiple Locations',
  multi_location: 'Multi-Location',
  calendar_booking: 'Calendar Booking',
  advanced_analytics: 'Advanced Analytics',
  report_builder: 'Report Builder',
  scheduled_reports: 'Scheduled Reports',
  custom_branding: 'Custom Branding',
  team_collaboration: 'Team Collaboration',
  white_label: 'White Label',
  priority_support: 'Priority Support',
};

// Limit labels for display
const LIMIT_LABELS: Record<string, string> = {
  max_conversations: 'conversations/mo',
  max_messages: 'messages/mo',
  max_api_calls: 'API calls/mo',
  max_knowledge_sources: 'knowledge sources',
  max_locations: 'locations',
  max_team_members: 'team members',
};

// Default descriptions based on plan name
const PLAN_DESCRIPTIONS: Record<string, string> = {
  'Starter': 'For solo users getting started.',
  'Growth': 'For growing teams.',
  'Professional': 'For established businesses.',
  'Business': 'For larger organizations.',
  'Enterprise': 'For enterprise needs.',
};

export function PlanCard({
  plan,
  billingPeriod,
  isCurrentPlan = false,
  onSelect,
  loading = false,
  disabled = false,
}: PlanCardProps) {
  const price = billingPeriod === 'yearly' 
    ? Math.round(plan.price_yearly / 12) 
    : plan.price_monthly;
  
  const priceId = billingPeriod === 'yearly' 
    ? plan.stripe_price_id_yearly 
    : plan.stripe_price_id_monthly;

  const description = plan.description || PLAN_DESCRIPTIONS[plan.name] || 'Perfect for your needs.';

  const handleSelect = () => {
    if (priceId && !isCurrentPlan) {
      onSelect(priceId);
    }
  };

  // Get all features with their enabled state
  const allFeatures = Object.entries(FEATURE_LABELS).map(([key, label]) => ({
    key,
    label,
    enabled: plan.features[key] ?? false,
  }));

  // Get limits that have values
  const limits = Object.entries(plan.limits)
    .filter(([key]) => LIMIT_LABELS[key])
    .map(([key, value]) => ({
      key,
      label: LIMIT_LABELS[key],
      value: value === -1 ? 'Unlimited' : value.toLocaleString(),
    }));

  return (
    <div className="flex flex-col h-full p-6">
      {/* Plan Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-lg font-semibold">{plan.name}</h3>
          {isCurrentPlan && (
            <Badge 
              variant="outline" 
              className="bg-success/10 text-success border-success/20 text-xs"
            >
              Your Plan
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">${price}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Per month, billed {billingPeriod}
        </p>
      </div>

      {/* CTA Button */}
      <Button
        className="w-full mb-6"
        variant={isCurrentPlan ? "outline" : "default"}
        disabled={!priceId || isCurrentPlan || loading || disabled}
        onClick={handleSelect}
      >
        {loading ? (
          <>
            <Loading02 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Processing...
          </>
        ) : isCurrentPlan ? (
          'Current Plan'
        ) : priceId ? (
          'Upgrade'
        ) : (
          'Contact Sales'
        )}
      </Button>

      {/* Limits */}
      {limits.length > 0 && (
        <div className="space-y-2 mb-4">
          {limits.map(({ key, label, value }) => (
            <div key={key} className="flex items-center gap-2 text-sm">
              <Check size={14} className="text-success shrink-0" aria-hidden="true" />
              <span>
                Up to <span className="font-medium">{value}</span> {label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Features */}
      <div className="space-y-2 flex-1">
        {allFeatures.map(({ key, label, enabled }) => (
          <div 
            key={key} 
            className={cn(
              "flex items-center gap-2 text-sm",
              !enabled && "text-muted-foreground"
            )}
          >
            {enabled ? (
              <Check size={14} className="text-success shrink-0" aria-hidden="true" />
            ) : (
              <X size={14} className="text-muted-foreground/50 shrink-0" aria-hidden="true" />
            )}
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
