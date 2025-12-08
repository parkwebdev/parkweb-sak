import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ResponseAction {
  condition: {
    status_code?: number;
    body_contains?: string;
  };
  action: {
    type: string;
    updates: Record<string, string>;
  };
}

interface ResponseActionBuilderProps {
  actions: ResponseAction[];
  onChange: (actions: ResponseAction[]) => void;
}

const ACTION_TYPES = [
  { value: 'update_lead', label: 'Update Lead' },
  { value: 'update_conversation', label: 'Update Conversation' },
];

const LEAD_UPDATE_FIELDS = [
  { value: 'status', label: 'Status', options: ['new', 'contacted', 'qualified', 'converted'] },
  { value: 'company', label: 'Company' },
  { value: 'phone', label: 'Phone' },
];

export const ResponseActionBuilder = ({ actions, onChange }: ResponseActionBuilderProps) => {
  const addAction = () => {
    onChange([
      ...actions,
      {
        condition: { status_code: 200 },
        action: { type: 'update_lead', updates: {} },
      },
    ]);
  };

  const updateAction = (index: number, updates: Partial<ResponseAction>) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], ...updates };
    onChange(newActions);
  };

  const updateActionCondition = (index: number, key: keyof ResponseAction['condition'], value: number | string) => {
    const newActions = [...actions];
    newActions[index] = {
      ...newActions[index],
      condition: { ...newActions[index].condition, [key]: value },
    };
    onChange(newActions);
  };

  const updateActionType = (index: number, type: string) => {
    const newActions = [...actions];
    newActions[index] = {
      ...newActions[index],
      action: { ...newActions[index].action, type },
    };
    onChange(newActions);
  };

  const updateActionField = (index: number, field: string, value: string) => {
    const newActions = [...actions];
    newActions[index] = {
      ...newActions[index],
      action: {
        ...newActions[index].action,
        updates: { ...newActions[index].action.updates, [field]: value },
      },
    };
    onChange(newActions);
  };

  const removeAction = (index: number) => {
    onChange(actions.filter((_, i) => i !== index));
  };

  const removeActionField = (actionIndex: number, field: string) => {
    const newActions = [...actions];
    const { [field]: removed, ...rest } = newActions[actionIndex].action.updates;
    newActions[actionIndex] = {
      ...newActions[actionIndex],
      action: { ...newActions[actionIndex].action, updates: rest },
    };
    onChange(newActions);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Response Actions</Label>
        <Button type="button" variant="outline" size="sm" onClick={addAction}>
          + Add Action
        </Button>
      </div>

      {actions.length > 0 && (
        <div className="space-y-4">
          {actions.map((action, actionIndex) => (
            <div key={actionIndex} className="border rounded-md p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Action {actionIndex + 1}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAction(actionIndex)}
                >
                  Remove
                </Button>
              </div>

              <div className="space-y-3 pl-3 border-l-2">
                <div>
                  <Label className="text-xs text-muted-foreground">When Response</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <Label className="text-xs">Status Code</Label>
                      <Input
                        type="number"
                        placeholder="200"
                        value={action.condition.status_code || ''}
                        onChange={(e) =>
                          updateActionCondition(actionIndex, 'status_code', parseInt(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Body Contains</Label>
                      <Input
                        placeholder="success"
                        value={action.condition.body_contains || ''}
                        onChange={(e) =>
                          updateActionCondition(actionIndex, 'body_contains', e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Then</Label>
                  <div className="space-y-2 mt-2">
                    <Select
                      value={action.action.type}
                      onValueChange={(value) => updateActionType(actionIndex, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTION_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {action.action.type === 'update_lead' && (
                      <div className="space-y-2 pl-3 border-l">
                        {Object.entries(action.action.updates).map(([field, value]) => (
                          <div key={field} className="flex gap-2">
                            <div className="flex-1">
                              <Label className="text-xs">{field}</Label>
                              <Input
                                value={value}
                                onChange={(e) =>
                                  updateActionField(actionIndex, field, e.target.value)
                                }
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeActionField(actionIndex, field)}
                            >
                              ✕
                            </Button>
                          </div>
                        ))}

                        <Select
                          value=""
                          onValueChange={(field) => updateActionField(actionIndex, field, '')}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="+ Add field to update" />
                          </SelectTrigger>
                          <SelectContent>
                            {LEAD_UPDATE_FIELDS.filter(
                              (f) => !action.action.updates[f.value]
                            ).map((field) => (
                              <SelectItem key={field.value} value={field.value}>
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {actions.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No response actions configured. Webhook responses will not trigger any actions.
        </p>
      )}
    </div>
  );
};