/**
 * SecuritySection Component
 * 
 * Combined security guardrails editor with toggles and custom text.
 * 
 * @module components/admin/prompts/sections/SecuritySection
 */

import { useState, useEffect, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw01 } from '@untitledui/icons';
import { LightbulbIcon } from '@/components/ui/lightbulb-icon';
import { useAutoSave } from '@/hooks/useAutoSave';
import { AdminSectionHeader } from '../AdminSectionHeader';
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
  version?: number;
  lastUpdated?: string;
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
  version,
  lastUpdated,
}: SecuritySectionProps) {
  const [localValue, setLocalValue] = useState(value);
  const [hasChanges, setHasChanges] = useState(false);
  const [localConfig, setLocalConfig] = useState<SecurityGuardrailsConfig>(guardrailsConfig);

  useEffect(() => {
    setLocalValue(value);
    setHasChanges(false);
  }, [value]);

  useEffect(() => {
    setLocalConfig(guardrailsConfig);
  }, [guardrailsConfig]);

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
    setLocalValue(DEFAULT_SECURITY_GUARDRAILS);
    setHasChanges(DEFAULT_SECURITY_GUARDRAILS !== value);
    save(DEFAULT_SECURITY_GUARDRAILS);
  }, [value, save]);

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
                <p className="font-medium text-xs mb-1">Security Tips</p>
                <ul className="text-xs space-y-0.5 text-muted-foreground">
                  {SECURITY_TIPS.map((tip, i) => (
                    <li key={i}>• {tip}</li>
                  ))}
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        }
      />

      <div className="space-y-6">
        {/* Master Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
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
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
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
            <Label htmlFor="security-text" className="text-sm font-medium">
              Custom Security Rules
            </Label>
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
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {lastUpdated && `Last updated: ${new Date(lastUpdated).toLocaleDateString()}`}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={localValue === DEFAULT_SECURITY_GUARDRAILS || !localConfig.enabled}
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
