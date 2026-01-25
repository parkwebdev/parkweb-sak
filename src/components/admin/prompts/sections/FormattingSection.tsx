/**
 * FormattingSection Component
 * 
 * Editor for the Response Formatting rules section.
 * 
 * @module components/admin/prompts/sections/FormattingSection
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LightbulbIcon, LightbulbIconFilled } from '@/components/ui/lightbulb-icon';
import { useAutoSave } from '@/hooks/useAutoSave';
import { AdminSectionHeader } from '../AdminSectionHeader';
import { PromptMetrics } from '../PromptMetrics';
import { ResetToDefaultButton } from '../ResetToDefaultButton';
import { validatePromptSection } from '@/lib/prompt-validation';
import { DEFAULT_FORMATTING_RULES } from '@/lib/prompt-defaults';

interface FormattingSectionProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  loading?: boolean;
  lastUpdated?: string;
  onUnsavedChange?: (hasChanges: boolean, saveFunction: () => Promise<void>) => void;
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
  lastUpdated,
  onUnsavedChange,
}: FormattingSectionProps) {
  const [localValue, setLocalValue] = useState(value);
  const [hasChanges, setHasChanges] = useState(false);
  const [isHoveringTip, setIsHoveringTip] = useState(false);

  useEffect(() => {
    setLocalValue(value);
    setHasChanges(false);
  }, [value]);

  // Notify parent of unsaved changes
  useEffect(() => {
    const saveFunction = async () => {
      const result = validatePromptSection('formatting', localValue);
      if (!result.valid) throw new Error(result.error);
      await onSave(localValue);
    };
    onUnsavedChange?.(hasChanges, saveFunction);
  }, [hasChanges, localValue, onSave, onUnsavedChange]);

  const validation = useMemo(
    () => validatePromptSection('formatting', localValue),
    [localValue]
  );

  const isDefault = localValue === DEFAULT_FORMATTING_RULES;

  const { save, status } = useAutoSave({
    onSave: async (newValue: string) => {
      const result = validatePromptSection('formatting', newValue);
      if (!result.valid) {
        throw new Error(result.error);
      }
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
    handleChange(DEFAULT_FORMATTING_RULES);
  }, [handleChange]);

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
        lastUpdated={lastUpdated}
        status={status}
        hasChanges={hasChanges}
        extra={
          <div className="flex items-center gap-1">
            <ResetToDefaultButton
              onReset={handleReset}
              disabled={isDefault}
              sectionName="Response Formatting"
            />
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                    onMouseEnter={() => setIsHoveringTip(true)}
                    onMouseLeave={() => setIsHoveringTip(false)}
                  >
                    {isHoveringTip ? (
                      <LightbulbIconFilled className="w-4 h-4 text-warning" />
                    ) : (
                      <LightbulbIcon className="w-4 h-4" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs p-3">
                  <p className="font-medium text-xs mb-1">Formatting Tips</p>
                  <ul className="text-xs space-y-0.5 text-muted-foreground">
                    {FORMATTING_TIPS.map((tip, i) => (
                      <li key={i}>• {tip}</li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        }
      />

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="formatting-rules" className="text-sm font-medium">
              Formatting Rules
            </Label>
            <PromptMetrics content={localValue} />
          </div>
          <Textarea
            id="formatting-rules"
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="RESPONSE FORMATTING (CRITICAL)..."
            rows={16}
            className="font-mono text-sm resize-y min-h-[250px]"
            aria-invalid={!validation.valid}
            aria-describedby={!validation.valid ? 'formatting-error' : undefined}
          />
          {!validation.valid && (
            <p id="formatting-error" className="text-xs text-destructive">
              {validation.error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
