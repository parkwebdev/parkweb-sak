/**
 * @fileoverview Redesigned pricing card with elevated styling for popular plans.
 * Features gradient accents, circular checkmarks, and better visual hierarchy.
 */

import { Check, Zap, Loading02 } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface PricingPlan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  features: Record<string, boolean>;
  limits: Record<string, number>;
  is_active?: boolean;
}

interface PricingCardProps {
  plan: PricingPlan;
  billingPeriod: 'monthly' | 'yearly';
  isPopular?: boolean;
  isCurrentPlan?: boolean;
  onSelect: (priceId: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

const FEATURE_LABELS: Record<string, string> = {
  widget: 'Chat Widget',
  api: 'API Access',
  api_access: 'API Access',
  webhooks: 'Webhooks',
  custom_tools: 'Custom AI Tools',
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

const LIMIT_LABELS: Record<string, string> = {
  max_conversations: 'Conversations/mo',
  max_messages: 'Messages/mo',
  max_api_calls: 'API Calls/mo',
  max_knowledge_sources: 'Knowledge Sources',
  max_locations: 'Locations',
  max_team_members: 'Team Members',
};

export function PricingCard({ 
  plan, 
  billingPeriod, 
  isPopular = false, 
  isCurrentPlan = false,
  onSelect,
  loading = false,
  disabled = false,
}: PricingCardProps) {
  const price = billingPeriod === 'yearly' ? plan.price_yearly : plan.price_monthly;
  const monthlyEquivalent = billingPeriod === 'yearly' 
    ? Math.round(plan.price_yearly / 12) 
    : plan.price_monthly;
  
  const yearlyDiscount = plan.price_monthly > 0
    ? Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100)
    : 0;

  const priceId = billingPeriod === 'yearly' 
    ? plan.stripe_price_id_yearly 
    : plan.stripe_price_id_monthly;

  const enabledFeatures = Object.entries(plan.features)
    .filter(([_, enabled]) => enabled)
    .map(([key]) => key);

  const handleSelect = () => {
    if (priceId && !isCurrentPlan) {
      onSelect(priceId);
    }
  };

  const showPopularStyling = isPopular && !isCurrentPlan;

  return (
    <Card 
      className={cn(
        "relative flex flex-col overflow-hidden transition-all duration-300",
        // Popular plan gets elevated treatment
        showPopularStyling && [
          "ring-2 ring-primary",
          "shadow-lg shadow-primary/10",
          "scale-[1.02] z-10",
        ],
        // Current plan indicator
        isCurrentPlan && "ring-2 ring-success",
        // Default styling
        !showPopularStyling && !isCurrentPlan && "hover:shadow-md"
      )}
    >
      {/* Gradient background for popular plan */}
      {showPopularStyling && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-primary/4 pointer-events-none" 
          aria-hidden="true"
        />
      )}

      {/* Popular badge - positioned at top edge */}
      {showPopularStyling && (
        <div className="absolute top-0 inset-x-0 flex justify-center -translate-y-1/2 z-20">
          <Badge className="gap-1.5 bg-primary text-primary-foreground shadow-md px-3 py-1">
            <Zap size={12} aria-hidden="true" />
            Most Popular
          </Badge>
        </div>
      )}

      {/* Current plan badge */}
      {isCurrentPlan && (
        <div className="absolute top-0 inset-x-0 flex justify-center -translate-y-1/2 z-20">
          <Badge variant="outline" className="bg-success/10 text-success border-success/30 px-3 py-1">
            <Check size={12} className="mr-1" aria-hidden="true" />
            Current Plan
          </Badge>
        </div>
      )}

      <CardHeader className={cn(
        "text-center pb-4 relative",
        (showPopularStyling || isCurrentPlan) ? "pt-8" : "pt-6"
      )}>
        {/* Plan name */}
        <CardTitle className="text-lg font-semibold">{plan.name}</CardTitle>
        
        {/* Price - larger, bolder */}
        <div className="mt-4 flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold tracking-tight">
            ${monthlyEquivalent}
          </span>
          <span className="text-muted-foreground text-sm">/month</span>
        </div>
        
        {/* Billed amount for yearly */}
        {billingPeriod === 'yearly' && (
          <p className="text-xs text-muted-foreground mt-1">
            ${price} billed annually
          </p>
        )}

        {/* Yearly discount badge */}
        {billingPeriod === 'yearly' && yearlyDiscount > 0 && (
          <Badge 
            variant="outline" 
            className="mt-3 bg-success/10 text-success border-success/20"
          >
            Save {yearlyDiscount}% annually
          </Badge>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col px-6 pb-6 relative">
        {/* Divider */}
        <div className="border-t mb-5" />
        
        {/* Limits section */}
        <div className="space-y-2.5 mb-5">
          {Object.entries(plan.limits).map(([key, value]) => {
            const label = LIMIT_LABELS[key];
            if (!label) return null;
            return (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold">
                  {value === -1 ? 'Unlimited' : value.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="border-t mb-5" />

        {/* Features with circular checkmarks */}
        <div className="space-y-2.5 flex-1">
          {enabledFeatures.map((feature) => {
            const label = FEATURE_LABELS[feature];
            if (!label) return null;
            return (
              <div key={feature} className="flex items-center gap-2.5">
                <div className="h-5 w-5 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-success" aria-hidden="true" />
                </div>
                <span className="text-sm">{label}</span>
              </div>
            );
          })}
        </div>

        {/* CTA Button */}
        <div className="mt-6 pt-4 border-t">
          <Button 
            className="w-full" 
            size="lg"
            variant={showPopularStyling ? "default" : "outline"}
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
              'Get Started'
            ) : (
              'Coming Soon'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default PricingCard;
