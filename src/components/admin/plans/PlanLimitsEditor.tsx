/**
 * PlanLimitsEditor Component
 * 
 * Form for editing plan resource limits.
 * Uses centralized plan-config for consistent limit definitions.
 * 
 * @module components/admin/plans/PlanLimitsEditor
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PLAN_LIMITS } from '@/lib/plan-config';
import type { PlanLimits } from '@/types/admin';

interface PlanLimitsEditorProps {
  limits: PlanLimits;
  onChange: (limits: PlanLimits) => void;
}

/**
 * Editor component for plan resource limits.
 */
export function PlanLimitsEditor({ limits, onChange }: PlanLimitsEditorProps) {
  const handleChange = (key: keyof PlanLimits, value: string) => {
    const numValue = value === '' ? undefined : parseInt(value, 10);
    onChange({
      ...limits,
      [key]: numValue,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Resource Limits</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {PLAN_LIMITS.map((field) => (
            <div key={field.key} className="space-y-1">
              <Label htmlFor={`limit-${field.key}`} className="text-xs">
                {field.label}
              </Label>
              <Input
                id={`limit-${field.key}`}
                type="number"
                min={0}
                value={limits[field.key as keyof PlanLimits] ?? ''}
                onChange={(e) => handleChange(field.key as keyof PlanLimits, e.target.value)}
                placeholder="No limit"
                className="h-8 text-sm"
              />
              <p className="text-2xs text-muted-foreground">{field.description}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Leave empty for unlimited resources
        </p>
      </CardContent>
    </Card>
  );
}
