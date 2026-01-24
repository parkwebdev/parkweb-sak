/**
 * PlanFeaturesEditor Component
 * 
 * Row-based list for toggling plan features with inline category badges.
 * Uses centralized plan-config for consistent feature definitions.
 * 
 * @module components/admin/plans/PlanFeaturesEditor
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PLAN_FEATURES, type FeatureConfig } from '@/lib/plan-config';
import type { PlanFeatures } from '@/types/admin';

interface PlanFeaturesEditorProps {
  features: PlanFeatures;
  onChange: (features: PlanFeatures) => void;
}

interface FeatureRowProps {
  field: FeatureConfig;
  checked: boolean;
  onToggle: () => void;
}

/**
 * Individual feature row with checkbox, title, description, and category badge.
 */
function FeatureRow({ field, checked, onToggle }: FeatureRowProps) {
  return (
    <div 
      className="flex items-start gap-3 py-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-muted/30 transition-colors -mx-4 px-4"
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      <Checkbox
        id={`feature-${field.key}`}
        checked={checked}
        onCheckedChange={onToggle}
        className="mt-0.5"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <Label
            htmlFor={`feature-${field.key}`}
            className="text-sm font-medium cursor-pointer"
          >
            {field.label}
          </Label>
          <Badge variant="outline" className="text-2xs shrink-0">
            {field.category}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {field.description}
        </p>
      </div>
    </div>
  );
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
      <CardContent className="pt-0">
        {PLAN_FEATURES.map((field) => (
          <FeatureRow
            key={field.key}
            field={field}
            checked={features[field.key as keyof PlanFeatures] ?? false}
            onToggle={() => handleToggle(field.key as keyof PlanFeatures)}
          />
        ))}
      </CardContent>
    </Card>
  );
}
