/**
 * FormattingSection Component
 * 
 * Editor for the Response Formatting rules section.
 * 
 * @module components/admin/prompts/sections/FormattingSection
 */

import { useState, useEffect, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw01 } from '@untitledui/icons';
import { LightbulbIcon } from '@/components/ui/lightbulb-icon';
import { useAutoSave } from '@/hooks/useAutoSave';
import { AdminSectionHeader } from '../AdminSectionHeader';
import { DEFAULT_FORMATTING_RULES } from '@/lib/prompt-defaults';

interface FormattingSectionProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  loading?: boolean;
  version?: number;
  lastUpdated?: string;
}

const FORMATTING_TIPS = [
  'Keep messages short for chat interfaces',
  'Use "|||" for message chunking/pauses',
  'Avoid excessive markdown in responses',
  'Match the brand voice and tone',
];

export function FormattingSection({
  value,
  onSave,
  loading,
  version,
  lastUpdated,
}: FormattingSectionProps) {
  const [localValue, setLocalValue] = useState(value);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalValue(value);
    setHasChanges(false);
  }, [value]);

  const { save, status } = useAutoSave({
    onSave: async (newValue: string) => {
      await onSave(newValue);
      setHasChanges(false);
    },
    debounceMs: 1500,
  });

  const handleChange = useCallback((newValue: string) => {
    setLocalValue(newValue);
    setHasChanges(newValue !== value);
    save(newValue);
  }, [value, save]);

  const handleReset = useCallback(() => {
    setLocalValue(DEFAULT_FORMATTING_RULES);
    setHasChanges(DEFAULT_FORMATTING_RULES !== value);
    save(DEFAULT_FORMATTING_RULES);
  }, [value, save]);

  if (loading) {
    return (
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-72 mb-6" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  return (
    <div>
      <AdminSectionHeader
        title="Response Formatting"
        description="Controls message chunking, conciseness, and link formatting"
        version={version}
        lastUpdated={lastUpdated}
        status={status}
        hasChanges={hasChanges}
        extra={
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                  <LightbulbIcon className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="font-medium text-xs mb-1">Formatting Tips</p>
                <ul className="text-xs space-y-0.5 text-muted-foreground">
                  {FORMATTING_TIPS.map((tip, i) => (
                    <li key={i}>• {tip}</li>
                  ))}
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        }
      />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="formatting-rules" className="text-sm font-medium">
            Formatting Rules
          </Label>
          <Textarea
            id="formatting-rules"
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="RESPONSE FORMATTING (CRITICAL)..."
            rows={16}
            className="font-mono text-sm resize-y min-h-[250px]"
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {lastUpdated && `Last updated: ${new Date(lastUpdated).toLocaleDateString()}`}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={localValue === DEFAULT_FORMATTING_RULES}
            className="text-xs"
          >
            <RefreshCw01 size={14} className="mr-1" aria-hidden="true" />
            Reset to default
          </Button>
        </div>
      </div>
    </div>
  );
}
