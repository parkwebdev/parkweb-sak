/**
 * PricingCard Component
 * 
 * Displays a single subscription plan with features and checkout button.
 * 
 * @module components/pricing/PricingCard
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap } from '@untitledui/icons';
import { cn } from '@/lib/utils';

export interface PricingPlan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  features: Record<string, boolean>;
  limits: Record<string, number>;
  is_active: boolean;
}

interface PricingCardProps {
  plan: PricingPlan;
  billingPeriod: 'monthly' | 'yearly';
  isCurrentPlan?: boolean;
  onSelect: (priceId: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

// Feature labels for display
const FEATURE_LABELS: Record<string, string> = {
  widget: 'Chat Widget',
  api_access: 'API Access',
  webhooks: 'Webhooks',
  custom_branding: 'Custom Branding',
  calendar_booking: 'Calendar Booking',
  advanced_analytics: 'Advanced Analytics',
  team_collaboration: 'Team Collaboration',
  custom_tools: 'Custom AI Tools',
  multi_location: 'Multi-Location',
  white_label: 'White Label',
  priority_support: 'Priority Support',
};

// Limit labels for display
const LIMIT_LABELS: Record<string, string> = {
  max_conversations: 'Conversations/mo',
  max_api_calls: 'API Calls/mo',
  max_knowledge_sources: 'Knowledge Sources',
  max_team_members: 'Team Members',
  max_locations: 'Locations',
};

/**
 * Pricing card component for a single plan.
 */
export function PricingCard({
  plan,
  billingPeriod,
  isCurrentPlan = false,
  onSelect,
  loading = false,
  disabled = false,
}: PricingCardProps) {
  const price = billingPeriod === 'monthly' ? plan.price_monthly : plan.price_yearly;
  const priceId = billingPeriod === 'monthly' 
    ? plan.stripe_price_id_monthly 
    : plan.stripe_price_id_yearly;
  
  const monthlyEquivalent = billingPeriod === 'yearly' 
    ? Math.round(plan.price_yearly / 12) 
    : plan.price_monthly;

  const yearlyDiscount = plan.price_monthly > 0 
    ? Math.round((1 - (plan.price_yearly / 12) / plan.price_monthly) * 100)
    : 0;

  const enabledFeatures = Object.entries(plan.features)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key);

  const handleSelect = () => {
    if (priceId) {
      onSelect(priceId);
    }
  };

  const isPopular = plan.name.toLowerCase().includes('advanced') || 
                    plan.name.toLowerCase().includes('pro');

  return (
    <Card 
      className={cn(
        "relative flex flex-col transition-all",
        isCurrentPlan && "ring-2 ring-primary",
        isPopular && !isCurrentPlan && "ring-2 ring-accent-foreground/20"
      )}
    >
      {/* Popular badge */}
      {isPopular && !isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="gap-1 bg-accent-foreground text-accent">
            <Zap size={12} aria-hidden="true" />
            Most Popular
          </Badge>
        </div>
      )}

      {/* Current plan badge */}
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="default" className="gap-1">
            <Check size={12} aria-hidden="true" />
            Current Plan
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pt-8">
        <CardTitle className="text-lg">{plan.name}</CardTitle>
        
        <div className="mt-4">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl font-bold">${monthlyEquivalent}</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          
          {billingPeriod === 'yearly' && yearlyDiscount > 0 && (
            <p className="text-sm text-status-active mt-1">
              Save {yearlyDiscount}% with annual billing
            </p>
          )}
          
          {billingPeriod === 'yearly' && (
            <p className="text-xs text-muted-foreground mt-1">
              ${price} billed annually
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Limits */}
        <div className="space-y-2 mb-6">
          {Object.entries(plan.limits).map(([key, value]) => (
            <div key={key} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {LIMIT_LABELS[key] || key}
              </span>
              <span className="font-medium">
                {value === -1 ? 'Unlimited' : value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="space-y-2 flex-1">
          {enabledFeatures.map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-sm">
              <Check size={16} className="text-status-active shrink-0" aria-hidden="true" />
              <span>{FEATURE_LABELS[feature] || feature}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="mt-6">
          {isCurrentPlan ? (
            <Button variant="outline" className="w-full" disabled>
              Current Plan
            </Button>
          ) : (
            <Button 
              className="w-full" 
              onClick={handleSelect}
              disabled={disabled || loading || !priceId}
              variant={isPopular ? "default" : "outline"}
            >
              {loading ? 'Loading...' : priceId ? 'Get Started' : 'Coming Soon'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default PricingCard;
