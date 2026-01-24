/**
 * PlanFeaturesEditor Component
 * 
 * Checkbox grid for toggling plan features.
 * Only includes features that are actually implemented and enforced.
 * 
 * @module components/admin/plans/PlanFeaturesEditor
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { PlanFeatures } from '@/types/admin';

interface PlanFeaturesEditorProps {
  features: PlanFeatures;
  onChange: (features: PlanFeatures) => void;
}

/**
 * Feature fields that match actual database keys and are implemented.
 * Removed: sso, audit_logs, custom_integrations, sla (not implemented)
 * Renamed: custom_branding → white_label (to match DB)
 */
const featureFields: { key: keyof PlanFeatures; label: string; description: string }[] = [
  { key: 'widget', label: 'Chat Widget', description: 'Embed chat widget on websites' },
  { key: 'hosted_page', label: 'Hosted Page', description: 'Standalone chat page' },
  { key: 'api', label: 'API Access', description: 'Programmatic API access' },
  { key: 'webhooks', label: 'Webhooks', description: 'Event webhook notifications' },
];

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
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {featureFields.map((field) => (
            <div key={field.key} className="flex items-start gap-3">
              <Checkbox
                id={`feature-${field.key}`}
                checked={features[field.key] ?? false}
                onCheckedChange={() => handleToggle(field.key)}
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
      </CardContent>
    </Card>
  );
}