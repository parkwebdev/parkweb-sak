/**
 * SmartFieldInput Component
 * 
 * A context-aware input that automatically renders the right control
 * based on the field type (status, stage, priority, etc.).
 * 
 * @module components/automations/panels/SmartFieldInput
 */

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLeadStages } from '@/hooks/useLeadStages';
import { PRIORITY_OPTIONS } from '@/lib/priority-config';
import { VariableInput } from './VariableInput';
import { LEAD_STATUS_OPTIONS, CONTEXT_AWARE_FIELDS } from './panelTypes';

interface SmartFieldInputProps {
  /** The field being edited (e.g., 'status', 'stage_id', 'data.priority') */
  field: string;
  /** Current value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Label for the input */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
}

export function SmartFieldInput({
  field,
  value,
  onChange,
  label,
  placeholder = 'Enter value',
}: SmartFieldInputProps) {
  const { stages, loading: stagesLoading } = useLeadStages();
  
  // Determine the field type
  const fieldType = CONTEXT_AWARE_FIELDS[field as keyof typeof CONTEXT_AWARE_FIELDS];

  // Lead Status dropdown
  if (fieldType === 'LEAD_STATUS') {
    return (
      <div className="space-y-2">
        {label && <Label>{label}</Label>}
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {LEAD_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Lead Stage dropdown
  if (fieldType === 'LEAD_STAGE') {
    return (
      <div className="space-y-2">
        {label && <Label>{label}</Label>}
        <Select value={value} onValueChange={onChange} disabled={stagesLoading}>
          <SelectTrigger>
            <SelectValue placeholder={stagesLoading ? 'Loading...' : 'Select stage'} />
          </SelectTrigger>
          <SelectContent>
            {stages.map((stage) => (
              <SelectItem key={stage.id} value={stage.id}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: stage.color }}
                  />
                  {stage.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Priority dropdown
  if (fieldType === 'PRIORITY') {
    return (
      <div className="space-y-2">
        {label && <Label>{label}</Label>}
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${option.dotColor}`} />
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Email field
  if (field === 'email') {
    return (
      <div className="space-y-2">
        {label && <Label>{label}</Label>}
        <Input
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'email@example.com'}
        />
      </div>
    );
  }

  // Phone field
  if (field === 'phone') {
    return (
      <div className="space-y-2">
        {label && <Label>{label}</Label>}
        <Input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || '+1 (555) 123-4567'}
        />
      </div>
    );
  }

  // Default: VariableInput for text fields with variable support
  return (
    <VariableInput
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      categories={['lead', 'conversation', 'trigger', 'environment']}
    />
  );
}
