/**
 * SecurityGuardrailsCard Component
 * 
 * Configuration card for security guardrail settings.
 * 
 * @module components/admin/prompts/SecurityGuardrailsCard
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface SecurityGuardrailsCardProps {
  /** Current guardrail configuration */
  config?: Record<string, boolean>;
  /** Callback when configuration changes */
  onChange: (config: Record<string, boolean>) => void;
  /** Loading state */
  loading?: boolean;
}

interface Guardrail {
  key: string;
  label: string;
  description: string;
}

const guardrails: Guardrail[] = [
  { 
    key: 'enabled', 
    label: 'Enable Security Guardrails', 
    description: 'Master toggle for all security features' 
  },
  { 
    key: 'block_pii', 
    label: 'Block PII Exposure', 
    description: 'Prevent agents from exposing personal information' 
  },
  { 
    key: 'block_prompt_injection', 
    label: 'Block Prompt Injection', 
    description: 'Detect and prevent prompt injection attempts' 
  },
];

/**
 * Security guardrails configuration card.
 */
export function SecurityGuardrailsCard({
  config,
  onChange,
  loading,
}: SecurityGuardrailsCardProps) {
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
