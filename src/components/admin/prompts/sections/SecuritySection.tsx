/**
 * SecuritySection Component
 * 
 * Combined security guardrails editor with toggles and custom text.
 * 
 * @module components/admin/prompts/sections/SecuritySection
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminSectionHeader } from '../AdminSectionHeader';
import { PromptMetrics } from '../PromptMetrics';
import { validatePromptSection } from '@/lib/prompt-validation';
import { DEFAULT_SECURITY_GUARDRAILS } from '@/lib/prompt-defaults';

interface SecurityGuardrailsConfig {
  enabled: boolean;
  block_pii: boolean;
  block_prompt_injection: boolean;
}

interface SecuritySectionProps {
  value: string;
  guardrailsConfig: SecurityGuardrailsConfig;
  onSave: (value: string) => Promise<void>;
  onGuardrailsChange: (config: SecurityGuardrailsConfig) => Promise<void>;
  loading?: boolean;
  lastUpdated?: string;
  onUnsavedChange?: (hasChanges: boolean, saveFunction: () => Promise<void>, draftValue?: string, resetFunction?: () => void) => void;
}

const GUARDRAIL_OPTIONS = [
  {
    key: 'block_pii' as const,
    label: 'Block PII Exposure',
    description: 'Prevent agents from exposing personal information',
  },
  {
    key: 'block_prompt_injection' as const,
    label: 'Block Prompt Injection',
    description: 'Detect and prevent prompt injection attempts',
  },
];


export function SecuritySection({
  value,
  guardrailsConfig,
  onSave,
  onGuardrailsChange,
  loading,
  lastUpdated,
  onUnsavedChange,
}: SecuritySectionProps) {
  const [localValue, setLocalValue] = useState(value);
  const [hasChanges, setHasChanges] = useState(false);
  const [localConfig, setLocalConfig] = useState<SecurityGuardrailsConfig>(guardrailsConfig);
  

  // Store latest onSave in ref to avoid effect dependency issues
  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    setLocalValue(value);
    setHasChanges(false);
  }, [value]);

  useEffect(() => {
    setLocalConfig(guardrailsConfig);
  }, [guardrailsConfig]);

  const handleChange = useCallback((newValue: string) => {
    setLocalValue(newValue);
    setHasChanges(newValue !== value);
  }, [value]);

  const handleReset = useCallback(() => {
    handleChange(DEFAULT_SECURITY_GUARDRAILS);
  }, [handleChange]);

  // Notify parent of unsaved changes
  useEffect(() => {
    const saveFunction = async () => {
      const result = validatePromptSection('security', localValue);
      if (!result.valid) throw new Error(result.error);
      await onSaveRef.current(localValue);
    };
    onUnsavedChange?.(hasChanges, saveFunction, hasChanges ? localValue : undefined, handleReset);
  }, [hasChanges, localValue, onUnsavedChange, handleReset]);

  const validation = useMemo(
    () => validatePromptSection('security', localValue),
    [localValue]
  );

  const handleToggle = useCallback(async (key: keyof SecurityGuardrailsConfig, checked: boolean) => {
    const newConfig = { ...localConfig, [key]: checked };
    setLocalConfig(newConfig);
    await onGuardrailsChange(newConfig);
  }, [localConfig, onGuardrailsChange]);

  if (loading) {
    return (
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-72 mb-6" />
        <Skeleton className="h-16 w-full mb-4" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  return (
    <div>
      <AdminSectionHeader
        title="Security Guardrails"
        description="Rules to prevent prompt injection, PII exposure, and misuse"
        lastUpdated={lastUpdated}
      />

      <div className="space-y-6">
        {/* Master Toggle */}
        <div className="flex items-center justify-between p-4 rounded-card border border-border bg-muted/30">
          <div>
            <p className="text-sm font-medium">Enable Security Guardrails</p>
            <p className="text-xs text-muted-foreground">Master toggle for all security features</p>
          </div>
          <Switch
            checked={localConfig.enabled}
            onCheckedChange={(checked) => handleToggle('enabled', checked)}
          />
        </div>

        {/* Individual Guardrail Toggles */}
        {localConfig.enabled && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Automatic Protections</Label>
            <p className="text-xs text-muted-foreground -mt-1">
              These toggles generate default rules when no custom text is provided
            </p>
            <div className="space-y-2">
              {GUARDRAIL_OPTIONS.map((option) => (
                <div
                  key={option.key}
                  className="flex items-center justify-between p-3 rounded-card border border-border"
                >
                  <div>
                    <p className="text-sm">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                  <Switch
                    checked={localConfig[option.key]}
                    onCheckedChange={(checked) => handleToggle(option.key, checked)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Security Text */}
        {localConfig.enabled && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="security-text" className="text-sm font-medium">
                Custom Security Rules
              </Label>
              <PromptMetrics content={localValue} />
            </div>
            <p className="text-xs text-muted-foreground">
              When provided, this replaces the auto-generated rules from toggles above
            </p>
            <Textarea
              id="security-text"
              value={localValue}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="SECURITY RULES (ABSOLUTE - NEVER VIOLATE)..."
              rows={10}
              className="font-mono text-sm resize-y min-h-[150px]"
              aria-invalid={!validation.valid}
              aria-describedby={!validation.valid ? 'security-error' : undefined}
            />
            {!validation.valid && (
              <p id="security-error" className="text-xs text-destructive">
                {validation.error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
