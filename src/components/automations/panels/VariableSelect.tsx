/**
 * VariableSelect Component
 * 
 * A dropdown for selecting a single variable reference.
 * Used for fields that should only contain a variable, not mixed content.
 * 
 * @module components/automations/panels/VariableSelect
 */

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getVariablesForCategories, type VariableCategoryKey } from './variableConfig';

interface VariableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  categories: VariableCategoryKey[];
  placeholder?: string;
  label?: string;
  id?: string;
}

export function VariableSelect({
  value,
  onValueChange,
  categories,
  placeholder = 'Select a variable',
  label,
  id,
}: VariableSelectProps) {
  const [showCustom, setShowCustom] = useState(false);
  const groupedVariables = getVariablesForCategories(categories);

  // Check if current value is a known variable
  const allVariables = groupedVariables.flatMap((g) => g.variables);
  const isCustomValue = value && !allVariables.some((v) => `{{${v.path}}}` === value);

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === '__custom__') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      onValueChange(selectedValue);
    }
  };

  const handleCustomChange = (customValue: string) => {
    onValueChange(customValue);
  };

  if (showCustom || isCustomValue) {
    return (
      <div className="space-y-2">
        {label && <Label htmlFor={id}>{label}</Label>}
        <div className="flex gap-2">
          <Input
            id={id}
            value={value}
            onChange={(e) => handleCustomChange(e.target.value)}
            placeholder="{{variable.path}}"
            className="font-mono text-xs"
          />
          <button
            type="button"
            onClick={() => {
              setShowCustom(false);
              onValueChange('');
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
        <p className="text-2xs text-muted-foreground">
          Enter a custom variable path like {'{{node.xyz.output}}'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <Select value={value} onValueChange={handleSelectChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {groupedVariables.map((group) => (
            <SelectGroup key={group.category}>
              <SelectLabel>{group.label}</SelectLabel>
              {group.variables.map((variable) => (
                <SelectItem
                  key={variable.path}
                  value={`{{${variable.path}}}`}
                  className="font-mono text-xs"
                >
                  <span className="flex items-center justify-between gap-4 w-full">
                    <span>{`{{${variable.path}}}`}</span>
                    <span className="text-muted-foreground font-sans text-2xs">
                      {variable.description}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
          <SelectGroup>
            <SelectItem value="__custom__" className="text-muted-foreground">
              Custom variable...
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
