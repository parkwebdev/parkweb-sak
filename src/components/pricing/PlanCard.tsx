/**
 * @fileoverview Plan card using centralized plan-config for consistent display.
 * Clean, borderless cards with subtle separators between columns.
 */

import { Check, X, Loading02 } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PLAN_FEATURES, PLAN_LIMITS, FEATURE_LABELS, LIMIT_DISPLAY_LABELS } from '@/lib/plan-config';

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

/**
 * Formats a limit value for display.
 * -1 = Unlimited, null/undefined = hidden, otherwise formatted number.
 */
function formatLimitValue(value: number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (value === -1) return 'Unlimited';
  return value.toLocaleString();
}

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

  const handleSelect = () => {
    if (priceId && !isCurrentPlan) {
      onSelect(priceId);
    }
  };

  // Get features from centralized config with their enabled state
  const allFeatures = PLAN_FEATURES.map(f => ({
    key: f.key,
    label: FEATURE_LABELS[f.key],
    enabled: plan.features[f.key] ?? false,
  }));

  // Get limits from centralized config that have values
  const limits = PLAN_LIMITS
    .map(l => ({
      key: l.key,
      label: LIMIT_DISPLAY_LABELS[l.key],
      value: formatLimitValue(plan.limits[l.key]),
    }))
    .filter(l => l.value !== null);

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
