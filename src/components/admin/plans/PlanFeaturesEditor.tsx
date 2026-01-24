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
 * Feature fields organized by category.
 * All 11 gated features for subscription plans.
 */
const featureFields: { key: keyof PlanFeatures; label: string; description: string; category: string }[] = [
  // Core
  { key: 'widget', label: 'Chat Widget', description: 'Embed chat widget on websites', category: 'Core' },
  { key: 'api', label: 'API Access', description: 'Programmatic API access', category: 'Core' },
  { key: 'webhooks', label: 'Webhooks', description: 'Event webhook notifications', category: 'Core' },
  // Tools
  { key: 'custom_tools', label: 'Custom Tools', description: 'External API tool integrations', category: 'Tools' },
  { key: 'integrations', label: 'Integrations', description: 'Social, email & calendar connections', category: 'Tools' },
  // Knowledge & Locations
  { key: 'knowledge_sources', label: 'Knowledge Sources', description: 'Document & URL training', category: 'Knowledge' },
  { key: 'locations', label: 'Locations', description: 'Multi-location management', category: 'Knowledge' },
  { key: 'calendar_booking', label: 'Calendar Booking', description: 'AI appointment scheduling', category: 'Knowledge' },
  // Analytics & Reporting
  { key: 'advanced_analytics', label: 'Advanced Analytics', description: 'Deep performance insights', category: 'Analytics' },
  { key: 'report_builder', label: 'Report Builder', description: 'Custom report generation', category: 'Analytics' },
  { key: 'scheduled_reports', label: 'Scheduled Reports', description: 'Automated email delivery', category: 'Analytics' },
];

const categories = ['Core', 'Tools', 'Knowledge', 'Analytics'];

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
        {categories.map((category) => (
          <div key={category} className="space-y-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{category}</h4>
            <div className="grid grid-cols-2 gap-4">
              {featureFields
                .filter((field) => field.category === category)
                .map((field) => (
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
          </div>
        ))}
      </CardContent>
    </Card>
  );
}