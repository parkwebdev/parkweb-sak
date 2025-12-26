import { useState, useId } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface Condition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface ConditionBuilderProps {
  conditions: { rules: Condition[]; logic: string };
  onChange: (conditions: { rules: Condition[]; logic: string }) => void;
  eventType: string;
}

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with', label: 'Ends With' },
];

const LEAD_FIELDS = [
  { value: 'status', label: 'Status' },
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'company', label: 'Company' },
  { value: 'phone', label: 'Phone' },
];

const CONVERSATION_FIELDS = [
  { value: 'status', label: 'Status' },
  { value: 'agent_id', label: 'Agent ID' },
];

export const ConditionBuilder = ({ conditions, onChange, eventType }: ConditionBuilderProps) => {
  const fields = eventType.includes('lead') ? LEAD_FIELDS : CONVERSATION_FIELDS;

  const addCondition = () => {
    onChange({
      ...conditions,
      rules: [...conditions.rules, { id: crypto.randomUUID(), field: fields[0].value, operator: 'equals', value: '' }],
    });
  };

  const updateCondition = (id: string, updates: Partial<Omit<Condition, 'id'>>) => {
    const newRules = conditions.rules.map((rule) =>
      rule.id === id ? { ...rule, ...updates } : rule
    );
    onChange({ ...conditions, rules: newRules });
  };

  const removeCondition = (id: string) => {
    onChange({
      ...conditions,
      rules: conditions.rules.filter((rule) => rule.id !== id),
    });
  };

  const setLogic = (logic: string) => {
    onChange({ ...conditions, logic });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Event Filtering Conditions</Label>
        <Button type="button" variant="outline" size="sm" onClick={addCondition}>
          + Add Condition
        </Button>
      </div>

      {conditions.rules.length > 0 && (
        <>
          <div className="space-y-3">
            {conditions.rules.map((condition) => (
              <div key={condition.id} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs">Field</Label>
                  <Select
                    value={condition.field}
                    onValueChange={(value) => updateCondition(condition.id, { field: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fields.map((field) => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label className="text-xs">Operator</Label>
                  <Select
                    value={condition.operator}
                    onValueChange={(value) => updateCondition(condition.id, { operator: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATORS.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label className="text-xs">Value</Label>
                  <Input
                    placeholder="Enter value"
                    value={condition.value}
                    onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeCondition(condition.id)}
                  aria-label="Remove condition"
                >
                  <span aria-hidden="true">✕</span>
                </Button>
              </div>
            ))}
          </div>

          {conditions.rules.length > 1 && (
            <div className="flex items-center gap-3 pl-2">
              <Label className="text-xs text-muted-foreground">Match</Label>
              <RadioGroup
                value={conditions.logic}
                onValueChange={setLogic}
                className="flex gap-4"
              >
                <RadioGroupItem value="AND">
                  <span className="text-xs">All conditions (AND)</span>
                </RadioGroupItem>
                <RadioGroupItem value="OR">
                  <span className="text-xs">Any condition (OR)</span>
                </RadioGroupItem>
              </RadioGroup>
            </div>
          )}
        </>
      )}

      {conditions.rules.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No conditions added. Webhook will fire for all events.
        </p>
      )}
    </div>
  );
};