/**
 * PlanLimitsEditor Component
 * 
 * Form for editing plan resource limits.
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

const limitFields: { key: keyof PlanLimits; label: string; description: string }[] = [
  { key: 'agents', label: 'Agents', description: 'Max number of AI agents' },
  { key: 'conversations_per_month', label: 'Conversations/Month', description: 'Monthly conversation limit' },
  { key: 'knowledge_sources', label: 'Knowledge Sources', description: 'Max knowledge sources' },
  { key: 'team_members', label: 'Team Members', description: 'Max team members' },
  { key: 'locations', label: 'Locations', description: 'Max locations' },
  { key: 'api_calls_per_day', label: 'API Calls/Day', description: 'Daily API call limit' },
];

/**
 * Editor component for plan resource limits.
 */
export function PlanLimitsEditor({ limits, onChange }: PlanLimitsEditorProps) {
const handleChange = (key: keyof PlanLimits, value: string) => {
    const numValue = parseInt(value) || 0;
    onChange({
      ...limits,
      [key]: numValue === -1 ? undefined : numValue,
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
                min={-1}
                value={limits[field.key] ?? -1}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder="-1 for unlimited"
                className="h-8 text-sm"
              />
              <p className="text-2xs text-muted-foreground">{field.description}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Use -1 for unlimited resources
        </p>
      </CardContent>
    </Card>
  );
}
