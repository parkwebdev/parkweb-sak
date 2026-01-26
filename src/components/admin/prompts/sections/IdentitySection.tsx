/**
 * IdentitySection Component
 * 
 * Editor for the Identity & Role prompt section.
 * 
 * @module components/admin/prompts/sections/IdentitySection
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminSectionHeader } from '../AdminSectionHeader';
import { PromptMetrics } from '../PromptMetrics';
import { validatePromptSection } from '@/lib/prompt-validation';
import { DEFAULT_IDENTITY_PROMPT } from '@/lib/prompt-defaults';

interface IdentitySectionProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  loading?: boolean;
  lastUpdated?: string;
  onUnsavedChange?: (hasChanges: boolean, saveFunction: () => Promise<void>, draftValue?: string, resetFunction?: () => void) => void;
}


export function IdentitySection({
  value,
  onSave,
  loading,
  lastUpdated,
  onUnsavedChange,
}: IdentitySectionProps) {
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
    handleChange(DEFAULT_IDENTITY_PROMPT);
  }, [handleChange]);

  // Notify parent of unsaved changes
  useEffect(() => {
    const saveFunction = async () => {
      const result = validatePromptSection('identity', localValue);
      if (!result.valid) throw new Error(result.error);
      await onSaveRef.current(localValue);
    };
    onUnsavedChange?.(hasChanges, saveFunction, hasChanges ? localValue : undefined, handleReset);
  }, [hasChanges, localValue, onUnsavedChange, handleReset]);

  const validation = useMemo(
    () => validatePromptSection('identity', localValue),
    [localValue]
  );

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
