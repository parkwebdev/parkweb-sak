/**
 * @fileoverview Plan card using centralized plan-config for consistent display.
 * Shows cumulative features with visual distinction between new and inherited.
 */

import { Check, Loading02 } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoCircleIcon, InfoCircleIconFilled } from '@/components/ui/info-circle-icon';
import { 
  PLAN_FEATURES, 
  PLAN_LIMITS, 
  FEATURE_LABELS, 
  LIMIT_DISPLAY_LABELS,
  FEATURE_DESCRIPTIONS,
  LIMIT_DESCRIPTIONS 
} from '@/lib/plan-config';

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
  allPlans: PlanData[];
  billingPeriod: 'monthly' | 'yearly';
  isCurrentPlan?: boolean;
  onSelect: (priceId: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

interface FeatureItem {
  key: string;
  label: string;
  description: string;
}

interface InheritedGroup {
  planName: string;
  features: FeatureItem[];
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

/**
 * Builds feature groups showing new features and inherited features from previous tiers.
 */
function buildFeatureGroups(
  plan: PlanData,
  allPlans: PlanData[]
): { newFeatures: FeatureItem[]; inheritedGroups: InheritedGroup[] } {
  const sortedPlans = [...allPlans].sort((a, b) => a.price_monthly - b.price_monthly);
  const currentIndex = sortedPlans.findIndex(p => p.id === plan.id);
  const previousPlan = currentIndex > 0 ? sortedPlans[currentIndex - 1] : null;

  // Features NEW in this tier
  const newFeatures = PLAN_FEATURES
    .filter(f => plan.features[f.key])
    .filter(f => !previousPlan || !previousPlan.features[f.key])
    .map(f => ({
      key: f.key,
      label: FEATURE_LABELS[f.key],
      description: FEATURE_DESCRIPTIONS[f.key],
    }));

  // Build inherited feature groups from each previous tier
  const inheritedGroups: InheritedGroup[] = [];
  for (let i = currentIndex - 1; i >= 0; i--) {
    const tierPlan = sortedPlans[i];
    const prevPlan = i > 0 ? sortedPlans[i - 1] : null;
    
    const tierFeatures = PLAN_FEATURES
      .filter(f => tierPlan.features[f.key])
      .filter(f => !prevPlan || !prevPlan.features[f.key])
      .map(f => ({
        key: f.key,
        label: FEATURE_LABELS[f.key],
        description: FEATURE_DESCRIPTIONS[f.key],
      }));
    
    if (tierFeatures.length > 0) {
      inheritedGroups.push({
        planName: tierPlan.name,
        features: tierFeatures,
      });
    }
  }

  return { newFeatures, inheritedGroups };
}

export function PlanCard({
  plan,
  allPlans,
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

  // Get limits from centralized config that have values
  const limits = PLAN_LIMITS
    .map(l => ({
      key: l.key,
      label: LIMIT_DISPLAY_LABELS[l.key],
      value: formatLimitValue(plan.limits[l.key]),
      description: LIMIT_DESCRIPTIONS[l.key],
    }))
    .filter(l => l.value !== null);

  // Build cumulative feature groups
  const { newFeatures, inheritedGroups } = buildFeatureGroups(plan, allPlans);

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
        <div className="space-y-3 mb-4">
          {limits.map(({ key, label, value, description }) => (
            <div key={key} className="flex items-center gap-2 text-sm">
              <Check size={14} className="text-success shrink-0" aria-hidden="true" />
              <span>
                <span className="font-medium">{value}</span> {label}
              </span>
              {description && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      type="button" 
                      className="group inline-flex text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={`More info about ${label}`}
                    >
                      <InfoCircleIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      <InfoCircleIconFilled className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px]">
                    {description}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Features - Full Opacity */}
      {newFeatures.length > 0 && (
        <div className="space-y-2.5">
          {newFeatures.map(({ key, label, description }) => (
            <div key={key} className="flex items-center gap-2 text-sm">
              <Check size={14} className="text-success shrink-0" aria-hidden="true" />
              <span>{label}</span>
              {description && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      type="button" 
                      className="group inline-flex text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={`More info about ${label}`}
                    >
                      <InfoCircleIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      <InfoCircleIconFilled className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px]">
                    {description}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Inherited Feature Groups - Muted */}
      {inheritedGroups.map(({ planName, features }) => (
        <div key={planName} className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-2">
            Includes from {planName}:
          </p>
          <div className="space-y-1.5">
            {features.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check size={12} className="text-muted-foreground/50 shrink-0" aria-hidden="true" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
