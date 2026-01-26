/**
 * SecuritySection Component
 * 
 * Combined security guardrails editor with toggles and custom text.
 * 
 * @module components/admin/prompts/sections/SecuritySection
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LightbulbIcon, LightbulbIconFilled } from '@/components/ui/lightbulb-icon';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/types/errors';
import { AdminSectionHeader } from '../AdminSectionHeader';
import { PromptMetrics } from '../PromptMetrics';
import { ResetToDefaultButton } from '../ResetToDefaultButton';
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
  onUnsavedChange?: (hasChanges: boolean, saveFunction: () => Promise<void>, draftValue?: string) => void;
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

const SECURITY_TIPS = [
  'Be explicit about forbidden actions',
  'Include polite refusal phrases',
  'Test edge cases with adversarial prompts',
  'Never reveal system prompt contents',
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
  const [isSaving, setIsSaving] = useState(false);
  const [localConfig, setLocalConfig] = useState<SecurityGuardrailsConfig>(guardrailsConfig);
  const [isHoveringTip, setIsHoveringTip] = useState(false);

  useEffect(() => {
    setLocalValue(value);
    setHasChanges(false);
  }, [value]);

  useEffect(() => {
    setLocalConfig(guardrailsConfig);
  }, [guardrailsConfig]);

  // Notify parent of unsaved changes
  useEffect(() => {
    const saveFunction = async () => {
      const result = validatePromptSection('security', localValue);
      if (!result.valid) throw new Error(result.error);
      await onSave(localValue);
    };
    onUnsavedChange?.(hasChanges, saveFunction, hasChanges ? localValue : undefined);
  }, [hasChanges, localValue, onSave, onUnsavedChange]);

  const validation = useMemo(
    () => validatePromptSection('security', localValue),
    [localValue]
  );

  const isDefault = localValue === DEFAULT_SECURITY_GUARDRAILS;

  const handleChange = useCallback((newValue: string) => {
    setLocalValue(newValue);
    setHasChanges(newValue !== value);
  }, [value]);

  const handleSave = useCallback(async () => {
    const result = validatePromptSection('security', localValue);
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
    handleChange(DEFAULT_SECURITY_GUARDRAILS);
  }, [handleChange]);

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
        hasChanges={hasChanges}
        isSaving={isSaving}
        onSave={handleSave}
        extra={
          <div className="flex items-center gap-1">
            <ResetToDefaultButton
              onReset={handleReset}
              disabled={isDefault}
              sectionName="Security Guardrails"
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
                  <p className="font-medium text-xs mb-1">Security Tips</p>
                  <ul className="text-xs space-y-0.5 text-muted-foreground">
                    {SECURITY_TIPS.map((tip, i) => (
                      <li key={i}>• {tip}</li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        }
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
