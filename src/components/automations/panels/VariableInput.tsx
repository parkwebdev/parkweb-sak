/**
 * VariableInput Component
 * 
 * A text input or textarea with an "Insert Variable" button.
 * Used for fields that can contain mixed content (static text + variables).
 * 
 * @module components/automations/panels/VariableInput
 */

import { useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Code02 } from '@untitledui/icons';
import { getVariablesForCategories, type VariableCategoryKey } from './variableConfig';

interface VariableInputProps {
  value: string;
  onChange: (value: string) => void;
  categories: VariableCategoryKey[];
  placeholder?: string;
  label?: string;
  id?: string;
  multiline?: boolean;
  rows?: number;
  className?: string;
}

export function VariableInput({
  value,
  onChange,
  categories,
  placeholder,
  label,
  id,
  multiline = false,
  rows = 4,
  className,
}: VariableInputProps) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const groupedVariables = getVariablesForCategories(categories);

  const insertVariable = (variablePath: string) => {
    const variable = `{{${variablePath}}}`;
    const input = inputRef.current;
    
    if (input) {
      const start = input.selectionStart ?? value.length;
      const end = input.selectionEnd ?? value.length;
      const newValue = value.slice(0, start) + variable + value.slice(end);
      onChange(newValue);
      
      // Set cursor position after inserted variable
      setTimeout(() => {
        input.focus();
        const newPosition = start + variable.length;
        input.setSelectionRange(newPosition, newPosition);
      }, 0);
    } else {
      onChange(value + variable);
    }
    
    setOpen(false);
  };

  const inputElement = multiline ? (
    <Textarea
      ref={inputRef as React.RefObject<HTMLTextAreaElement>}
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={className}
    />
  ) : (
    <Input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <Label htmlFor={id}>{label}</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground"
              >
                <Code02 size={14} aria-hidden="true" />
                <span className="ml-1">Insert variable</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-0">
              <div className="max-h-64 overflow-y-auto">
                {groupedVariables.map((group) => (
                  <div key={group.category}>
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50">
                      {group.label}
                    </div>
                    {group.variables.map((variable) => (
                      <button
                        key={variable.path}
                        type="button"
                        onClick={() => insertVariable(variable.path)}
                        className="w-full px-3 py-2 text-left hover:bg-accent transition-colors"
                      >
                        <div className="font-mono text-xs">{`{{${variable.path}}}`}</div>
                        <div className="text-2xs text-muted-foreground">
                          {variable.description}
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
      {!label && (
        <div className="relative">
          {inputElement}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-6 w-6 p-0 text-muted-foreground"
              >
                <Code02 size={14} aria-hidden="true" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-0">
              <div className="max-h-64 overflow-y-auto">
                {groupedVariables.map((group) => (
                  <div key={group.category}>
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50">
                      {group.label}
                    </div>
                    {group.variables.map((variable) => (
                      <button
                        key={variable.path}
                        type="button"
                        onClick={() => insertVariable(variable.path)}
                        className="w-full px-3 py-2 text-left hover:bg-accent transition-colors"
                      >
                        <div className="font-mono text-xs">{`{{${variable.path}}}`}</div>
                        <div className="text-2xs text-muted-foreground">
                          {variable.description}
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
      {label && inputElement}
    </div>
  );
}
