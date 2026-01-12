/**
 * BaselinePromptEditor Component
 * 
 * Rich text editor for editing the baseline system prompt.
 * 
 * @module components/admin/prompts/BaselinePromptEditor
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Save01, RefreshCw01 } from '@untitledui/icons';

interface BaselinePromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
  saving?: boolean;
  version?: number;
  lastUpdated?: string;
}

/**
 * Editor component for the baseline prompt.
 */
export function BaselinePromptEditor({
  value,
  onChange,
  loading,
  saving,
  version,
  lastUpdated,
}: BaselinePromptEditorProps) {
  const [localValue, setLocalValue] = useState(value);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalValue(value);
    setHasChanges(false);
  }, [value]);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    setHasChanges(newValue !== value);
  };

  const handleSave = () => {
    onChange(localValue);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalValue(value);
    setHasChanges(false);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Baseline Prompt</CardTitle>
            <CardDescription>
              This prompt is prepended to all agent system prompts
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {version !== undefined && (
              <Badge variant="outline" className="text-xs">
                v{version}
              </Badge>
            )}
            {hasChanges && (
              <Badge variant="secondary" className="text-xs">
                Unsaved changes
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Enter the baseline prompt that will be applied to all agents..."
          className="min-h-[200px] font-mono text-sm resize-y"
          disabled={saving}
        />
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {lastUpdated && `Last updated: ${new Date(lastUpdated).toLocaleDateString()}`}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={!hasChanges || saving}
            >
              <RefreshCw01 size={14} className="mr-1" aria-hidden="true" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || saving}
            >
              <Save01 size={14} className="mr-1" aria-hidden="true" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Prompt preview component showing the combined prompt.
 */
export function PromptPreview({ prompt }: { prompt: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Preview</CardTitle>
        <CardDescription>
          How the baseline prompt appears to agents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm whitespace-pre-wrap font-mono">
          {prompt || 'No baseline prompt configured'}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Version history list component.
 */
export function PromptVersionHistory() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Version History</CardTitle>
        <CardDescription>
          Previous versions of the baseline prompt
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground text-center py-4">
          Version history will be available in a future update
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Security guardrails configuration card.
 */
export function SecurityGuardrailsCard({
  config,
  onChange,
  loading,
}: {
  config?: Record<string, boolean>;
  onChange: (config: Record<string, boolean>) => void;
  loading?: boolean;
}) {
  const guardrails = [
    { key: 'enabled', label: 'Enable Security Guardrails', description: 'Master toggle for all security features' },
    { key: 'block_pii', label: 'Block PII Exposure', description: 'Prevent agents from exposing personal information' },
    { key: 'block_prompt_injection', label: 'Block Prompt Injection', description: 'Detect and prevent prompt injection attempts' },
  ];

  const handleToggle = (key: string) => {
    onChange({
      ...config,
      [key]: !(config?.[key] ?? false),
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Security Guardrails</CardTitle>
        <CardDescription>
          Configure security features for all agents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {guardrails.map((guardrail) => (
          <div
            key={guardrail.key}
            className="flex items-center justify-between p-3 rounded-lg border border-border"
          >
            <div>
              <p className="text-sm font-medium">{guardrail.label}</p>
              <p className="text-xs text-muted-foreground">{guardrail.description}</p>
            </div>
            <Button
              variant={config?.[guardrail.key] ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleToggle(guardrail.key)}
            >
              {config?.[guardrail.key] ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
