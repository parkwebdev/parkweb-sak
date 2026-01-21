/**
 * LanguageSection Component
 * 
 * Editor for the Language Instruction section.
 * 
 * @module components/admin/prompts/sections/LanguageSection
 */

import { useState, useEffect, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw01 } from '@untitledui/icons';
import { useAutoSave } from '@/hooks/useAutoSave';
import { AdminSectionHeader } from '../AdminSectionHeader';
import { DEFAULT_LANGUAGE_INSTRUCTION } from '@/lib/prompt-defaults';

interface LanguageSectionProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  loading?: boolean;
  version?: number;
  lastUpdated?: string;
}

export function LanguageSection({
  value,
  onSave,
  loading,
  version,
  lastUpdated,
}: LanguageSectionProps) {
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
    setLocalValue(DEFAULT_LANGUAGE_INSTRUCTION);
    setHasChanges(DEFAULT_LANGUAGE_INSTRUCTION !== value);
    save(DEFAULT_LANGUAGE_INSTRUCTION);
  }, [value, save]);

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
        version={version}
        lastUpdated={lastUpdated}
        status={status}
        hasChanges={hasChanges}
      />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="language-instruction" className="text-sm font-medium">
            Language Behavior
          </Label>
          <Textarea
            id="language-instruction"
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="LANGUAGE: Always respond in the same language..."
            rows={4}
            className="font-mono text-sm resize-y min-h-[80px]"
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
            disabled={localValue === DEFAULT_LANGUAGE_INSTRUCTION}
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
