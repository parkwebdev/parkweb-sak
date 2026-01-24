/**
 * @fileoverview Feature comparison table showing all features across all plans.
 * Groups features by category with tooltips for descriptions.
 */

import { CheckCircle, Minus } from '@untitledui/icons';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoCircleIcon, InfoCircleIconFilled } from '@/components/ui/info-circle-icon';
import { cn } from '@/lib/utils';
import { 
  PLAN_FEATURES, 
  FEATURE_CATEGORIES,
  FEATURE_CATEGORY_COLORS,
} from '@/lib/plan-config';
import type { PlanData } from './PlanCard';

interface FeatureComparisonTableProps {
  plans: PlanData[];
}

export function FeatureComparisonTable({ plans }: FeatureComparisonTableProps) {
  // Sort plans by price for consistent column order
  const sortedPlans = [...plans].sort((a, b) => a.price_monthly - b.price_monthly);
  
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-background z-10">
          <tr className="border-b">
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Feature</th>
            {sortedPlans.map(plan => (
              <th key={plan.id} className="text-center py-3 px-4 font-medium min-w-[120px]">
                {plan.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FEATURE_CATEGORIES.map(category => {
            const categoryFeatures = PLAN_FEATURES.filter(f => f.category === category);
            if (categoryFeatures.length === 0) return null;
            
            const colors = FEATURE_CATEGORY_COLORS[category];
            
            return (
              <CategoryGroup key={category}>
                {/* Category Header Row */}
                <tr className="border-b bg-muted/30">
                  <td colSpan={sortedPlans.length + 1} className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", colors.dot)} />
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {category}
                      </span>
                    </div>
                  </td>
                </tr>
                
                {/* Feature Rows for this Category */}
                {categoryFeatures.map(feature => (
                  <tr key={feature.key} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span>{feature.label}</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button 
                              type="button"
                              className="group inline-flex text-muted-foreground hover:text-foreground transition-colors"
                              aria-label={`More info about ${feature.label}`}
                            >
                              <InfoCircleIcon className="h-3.5 w-3.5" aria-hidden="true" />
                              <InfoCircleIconFilled className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[220px]">
                            {feature.description}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </td>
                    {sortedPlans.map(plan => (
                      <td key={plan.id} className="text-center py-2.5 px-4">
                        {plan.features[feature.key] ? (
                          <CheckCircle size={16} className="text-success mx-auto" aria-label="Included" />
                        ) : (
                          <Minus size={16} className="text-muted-foreground/40 mx-auto" aria-label="Not included" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </CategoryGroup>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Fragment wrapper for category groups to avoid React key issues */
function CategoryGroup({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
