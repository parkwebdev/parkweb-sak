/**
 * LanguageSection Component
 * 
 * Editor for the Language Instruction section.
 * 
 * @module components/admin/prompts/sections/LanguageSection
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
import { DEFAULT_LANGUAGE_INSTRUCTION } from '@/lib/prompt-defaults';

interface LanguageSectionProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  loading?: boolean;
  lastUpdated?: string;
  onUnsavedChange?: (hasChanges: boolean, saveFunction: () => Promise<void>) => void;
}

const LANGUAGE_TIPS = [
  'Match the user\'s language automatically',
  'Specify formality level if needed',
  'Consider cultural context for greetings',
  'Handle mixed-language queries gracefully',
];

export function LanguageSection({
  value,
  onSave,
  loading,
  lastUpdated,
  onUnsavedChange,
}: LanguageSectionProps) {
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
      const result = validatePromptSection('language', localValue);
      if (!result.valid) throw new Error(result.error);
      await onSave(localValue);
    };
    onUnsavedChange?.(hasChanges, saveFunction);
  }, [hasChanges, localValue, onSave, onUnsavedChange]);

  const validation = useMemo(
    () => validatePromptSection('language', localValue),
    [localValue]
  );

  const isDefault = localValue === DEFAULT_LANGUAGE_INSTRUCTION;

  const { save, status } = useAutoSave({
    onSave: async (newValue: string) => {
      const result = validatePromptSection('language', newValue);
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
    handleChange(DEFAULT_LANGUAGE_INSTRUCTION);
  }, [handleChange]);

  if (loading) {
    return (
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-72 mb-6" />
        <Skeleton className="h-[120px] w-full" />
      </div>
    );
  }

  return (
    <div>
      <AdminSectionHeader
        title="Language Instruction"
        description="How Ari handles multilingual conversations"
        lastUpdated={lastUpdated}
        status={status}
        hasChanges={hasChanges}
        extra={
          <div className="flex items-center gap-1">
            <ResetToDefaultButton
              onReset={handleReset}
              disabled={isDefault}
              sectionName="Language Instruction"
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
                  <p className="font-medium text-xs mb-1">Language Tips</p>
                  <ul className="text-xs space-y-0.5 text-muted-foreground">
                    {LANGUAGE_TIPS.map((tip, i) => (
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
            <Label htmlFor="language-instruction" className="text-sm font-medium">
              Language Behavior
            </Label>
            <PromptMetrics content={localValue} />
          </div>
          <Textarea
            id="language-instruction"
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="LANGUAGE: Always respond in the same language..."
            rows={4}
            className="font-mono text-sm resize-y min-h-[80px]"
            aria-invalid={!validation.valid}
            aria-describedby={!validation.valid ? 'language-error' : undefined}
          />
          {!validation.valid && (
            <p id="language-error" className="text-xs text-destructive">
              {validation.error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
