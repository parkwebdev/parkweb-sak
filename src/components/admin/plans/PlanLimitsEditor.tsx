/**
 * PlanLimitsEditor Component
 * 
 * Form for editing plan resource limits.
 * Uses max_* naming convention to match database keys.
 * Single-agent model: no agents limit (each account gets exactly one).
 * 
 * @module components/admin/plans/PlanLimitsEditor
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PlanLimits } from '@/types/admin';

interface PlanLimitsEditorProps {
  limits: PlanLimits;
  onChange: (limits: PlanLimits) => void;
}

/**
 * Limit fields that match actual database keys.
 * Removed: agents (single-agent model), locations (not enforced)
 */
const limitFields: { key: keyof PlanLimits; label: string; description: string }[] = [
  { key: 'max_conversations_per_month', label: 'Conversations/Month', description: 'Monthly conversation limit' },
  { key: 'max_knowledge_sources', label: 'Knowledge Sources', description: 'Max knowledge sources' },
  { key: 'max_team_members', label: 'Team Members', description: 'Max team members' },
  { key: 'max_api_calls_per_month', label: 'API Calls/Month', description: 'Monthly API call limit' },
  { key: 'max_webhooks', label: 'Webhooks', description: 'Max webhook endpoints' },
];

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
          {limitFields.map((field) => (
            <div key={field.key} className="space-y-1">
              <Label htmlFor={`limit-${field.key}`} className="text-xs">
                {field.label}
              </Label>
              <Input
                id={`limit-${field.key}`}
                type="number"
                min={0}
                value={limits[field.key] ?? ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
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