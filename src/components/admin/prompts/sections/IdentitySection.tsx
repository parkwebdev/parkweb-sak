/**
 * IdentitySection Component
 * 
 * Editor for the Identity & Role prompt section.
 * 
 * @module components/admin/prompts/sections/IdentitySection
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LightbulbIcon, LightbulbIconFilled } from '@/components/ui/lightbulb-icon';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/types/errors';
import { AdminSectionHeader } from '../AdminSectionHeader';
import { PromptMetrics } from '../PromptMetrics';
import { ResetToDefaultButton } from '../ResetToDefaultButton';
import { validatePromptSection } from '@/lib/prompt-validation';
import { DEFAULT_IDENTITY_PROMPT } from '@/lib/prompt-defaults';

interface IdentitySectionProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  loading?: boolean;
  lastUpdated?: string;
  onUnsavedChange?: (hasChanges: boolean, saveFunction: () => Promise<void>, draftValue?: string) => void;
}

const IDENTITY_TIPS = [
  'Use first person ("I am...") for natural personality',
  'Define clear behavioral boundaries',
  'Specify expertise areas and limitations',
  'Keep the core identity concise but complete',
];

export function IdentitySection({
  value,
  onSave,
  loading,
  lastUpdated,
  onUnsavedChange,
}: IdentitySectionProps) {
  const [localValue, setLocalValue] = useState(value);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isHoveringTip, setIsHoveringTip] = useState(false);

  useEffect(() => {
    setLocalValue(value);
    setHasChanges(false);
  }, [value]);

  // Notify parent of unsaved changes
  useEffect(() => {
    const saveFunction = async () => {
      const result = validatePromptSection('identity', localValue);
      if (!result.valid) throw new Error(result.error);
      await onSave(localValue);
    };
    onUnsavedChange?.(hasChanges, saveFunction, hasChanges ? localValue : undefined);
  }, [hasChanges, localValue, onSave, onUnsavedChange]);

  const validation = useMemo(
    () => validatePromptSection('identity', localValue),
    [localValue]
  );

  const isDefault = localValue === DEFAULT_IDENTITY_PROMPT;

  const handleChange = useCallback((newValue: string) => {
    setLocalValue(newValue);
    setHasChanges(newValue !== value);
  }, [value]);

  const handleSave = useCallback(async () => {
    const result = validatePromptSection('identity', localValue);
    if (!result.valid) {
      toast.error('Validation failed', { description: result.error });
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave(localValue);
      setHasChanges(false);
      toast.success('Saved');
    } catch (error: unknown) {
      toast.error('Failed to save', { description: getErrorMessage(error) });
    } finally {
      setIsSaving(false);
    }
  }, [localValue, onSave]);

  const handleReset = useCallback(() => {
    handleChange(DEFAULT_IDENTITY_PROMPT);
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
        title="Identity & Role"
        description="The foundational prompt that defines who Ari is and how it behaves"
        lastUpdated={lastUpdated}
        hasChanges={hasChanges}
        isSaving={isSaving}
        onSave={handleSave}
        extra={
          <div className="flex items-center gap-1">
            <ResetToDefaultButton
              onReset={handleReset}
              disabled={isDefault}
              sectionName="Identity & Role"
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
                  <p className="font-medium text-xs mb-1">Identity Tips</p>
                  <ul className="text-xs space-y-0.5 text-muted-foreground">
                    {IDENTITY_TIPS.map((tip, i) => (
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
            <Label htmlFor="identity-prompt" className="text-sm font-medium">
              Base Personality
            </Label>
            <PromptMetrics content={localValue} />
          </div>
          <Textarea
            id="identity-prompt"
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="You are Ari, a helpful AI assistant..."
            rows={14}
            className="font-mono text-sm resize-y min-h-[200px]"
            aria-invalid={!validation.valid}
            aria-describedby={!validation.valid ? 'identity-error' : undefined}
          />
          {!validation.valid && (
            <p id="identity-error" className="text-xs text-destructive">
              {validation.error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
