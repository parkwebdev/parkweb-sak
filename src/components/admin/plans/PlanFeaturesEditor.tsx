/**
 * PlanFeaturesEditor Component
 * 
 * Checkbox grid for toggling plan features.
 * Uses centralized plan-config for consistent feature definitions.
 * 
 * @module components/admin/plans/PlanFeaturesEditor
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PLAN_FEATURES, FEATURE_CATEGORIES } from '@/lib/plan-config';
import type { PlanFeatures } from '@/types/admin';

interface PlanFeaturesEditorProps {
  features: PlanFeatures;
  onChange: (features: PlanFeatures) => void;
}

/**
 * Editor component for plan feature toggles.
 */
export function PlanFeaturesEditor({ features, onChange }: PlanFeaturesEditorProps) {
  const handleToggle = (key: keyof PlanFeatures) => {
    onChange({
      ...features,
      [key]: !features[key],
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Features</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {FEATURE_CATEGORIES.map((category) => (
          <div key={category} className="space-y-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{category}</h4>
            <div className="grid grid-cols-2 gap-4">
              {PLAN_FEATURES
                .filter((field) => field.category === category)
                .map((field) => (
                  <div key={field.key} className="flex items-start gap-3">
                    <Checkbox
                      id={`feature-${field.key}`}
                      checked={features[field.key as keyof PlanFeatures] ?? false}
                      onCheckedChange={() => handleToggle(field.key as keyof PlanFeatures)}
                    />
                    <div className="space-y-0.5">
                      <Label
                        htmlFor={`feature-${field.key}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {field.label}
                      </Label>
                      <p className="text-2xs text-muted-foreground">{field.description}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
