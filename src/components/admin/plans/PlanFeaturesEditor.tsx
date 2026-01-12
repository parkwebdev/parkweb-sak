/**
 * PlanFeaturesEditor Component
 * 
 * Checkbox grid for toggling plan features.
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

const featureFields: { key: keyof PlanFeatures; label: string; description: string }[] = [
  { key: 'advanced_analytics', label: 'Advanced Analytics', description: 'Detailed usage & performance reports' },
  { key: 'custom_branding', label: 'Custom Branding', description: 'White-label widget appearance' },
  { key: 'api_access', label: 'API Access', description: 'Programmatic API access' },
  { key: 'priority_support', label: 'Priority Support', description: 'Faster response times' },
  { key: 'sla', label: 'SLA', description: 'Service level agreement' },
  { key: 'sso', label: 'SSO', description: 'Single sign-on integration' },
  { key: 'audit_logs', label: 'Audit Logs', description: 'Activity logging & compliance' },
  { key: 'custom_integrations', label: 'Custom Integrations', description: 'Custom integration support' },
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
