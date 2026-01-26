/**
 * LanguageSection Component
 * 
 * Editor for the Language Instruction section.
 * 
 * @module components/admin/prompts/sections/LanguageSection
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminSectionHeader } from '../AdminSectionHeader';
import { PromptMetrics } from '../PromptMetrics';
import { validatePromptSection } from '@/lib/prompt-validation';
import { DEFAULT_LANGUAGE_INSTRUCTION } from '@/lib/prompt-defaults';

interface LanguageSectionProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  loading?: boolean;
  lastUpdated?: string;
  onUnsavedChange?: (hasChanges: boolean, saveFunction: () => Promise<void>, draftValue?: string, resetFunction?: () => void) => void;
}


export function LanguageSection({
  value,
  onSave,
  loading,
  lastUpdated,
  onUnsavedChange,
}: LanguageSectionProps) {
  const [localValue, setLocalValue] = useState(value);
  const [hasChanges, setHasChanges] = useState(false);
  

  // Store latest onSave in ref to avoid effect dependency issues
  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    setLocalValue(value);
    setHasChanges(false);
  }, [value]);

  const handleChange = useCallback((newValue: string) => {
    setLocalValue(newValue);
    setHasChanges(newValue !== value);
  }, [value]);

  const handleReset = useCallback(() => {
    handleChange(DEFAULT_LANGUAGE_INSTRUCTION);
  }, [handleChange]);

  // Notify parent of unsaved changes
  useEffect(() => {
    const saveFunction = async () => {
      const result = validatePromptSection('language', localValue);
      if (!result.valid) throw new Error(result.error);
      await onSaveRef.current(localValue);
    };
    onUnsavedChange?.(hasChanges, saveFunction, hasChanges ? localValue : undefined, handleReset);
  }, [hasChanges, localValue, onUnsavedChange, handleReset]);

  const validation = useMemo(
    () => validatePromptSection('language', localValue),
    [localValue]
  );

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
