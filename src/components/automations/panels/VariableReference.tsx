/**
 * VariableReference Component
 * 
 * Collapsible reference showing available variables for automation nodes.
 * 
 * @module components/automations/panels/VariableReference
 */

import { useState, useCallback } from 'react';
import { ChevronDown, Copy01, Check } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Variable {
  path: string;
  description: string;
}

interface VariableCategory {
  label: string;
  variables: Variable[];
}

const COMMON_LEAD_VARIABLES: Variable[] = [
  { path: 'lead.id', description: 'Lead ID' },
  { path: 'lead.name', description: 'Full name' },
  { path: 'lead.email', description: 'Email address' },
  { path: 'lead.phone', description: 'Phone number' },
  { path: 'lead.company', description: 'Company name' },
];

const COMMON_CONVERSATION_VARIABLES: Variable[] = [
  { path: 'conversation.id', description: 'Conversation ID' },
  { path: 'conversation.channel', description: 'Channel' },
  { path: 'conversation.status', description: 'Status' },
];

const ENVIRONMENT_VARIABLES: Variable[] = [
  { path: 'env.timestamp', description: 'Current timestamp' },
  { path: 'env.execution_id', description: 'Execution ID' },
];

interface VariableReferenceProps {
  /** Include lead variables */
  showLead?: boolean;
  /** Include conversation variables */
  showConversation?: boolean;
  /** Include environment variables */
  showEnvironment?: boolean;
  /** Additional custom categories */
  customCategories?: VariableCategory[];
  /** Compact mode for smaller panels */
  compact?: boolean;
}

export function VariableReference({
  showLead = true,
  showConversation = false,
  showEnvironment = true,
  customCategories = [],
  compact = false,
}: VariableReferenceProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const handleCopy = useCallback(async (path: string) => {
    const variable = `{{${path}}}`;
    await navigator.clipboard.writeText(variable);
    setCopiedPath(path);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedPath(null), 2000);
  }, []);

  const categories: VariableCategory[] = [
    ...customCategories,
    ...(showLead ? [{ label: 'Lead', variables: COMMON_LEAD_VARIABLES }] : []),
    ...(showConversation ? [{ label: 'Conversation', variables: COMMON_CONVERSATION_VARIABLES }] : []),
    ...(showEnvironment ? [{ label: 'Environment', variables: ENVIRONMENT_VARIABLES }] : []),
  ];

  if (categories.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-muted/30">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="font-medium">Available Variables</span>
        <ChevronDown
          size={14}
          className={cn('transition-transform', isExpanded && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {isExpanded && (
        <div className={cn('border-t border-border px-3 pb-3', compact ? 'space-y-2' : 'space-y-3')}>
          {categories.map((category) => (
            <div key={category.label} className="pt-2">
              <div className="text-2xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                {category.label}
              </div>
              <div className="space-y-1">
                {category.variables.map((variable) => (
                  <div
                    key={variable.path}
                    className="flex items-center justify-between gap-2 group"
                  >
                    <div className="flex-1 min-w-0">
                      <code className="text-xs font-mono text-foreground">
                        {`{{${variable.path}}}`}
                      </code>
                      <span className="text-2xs text-muted-foreground ml-2">
                        {variable.description}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleCopy(variable.path)}
                    >
                      {copiedPath === variable.path ? (
                        <Check size={12} className="text-status-active" aria-hidden="true" />
                      ) : (
                        <Copy01 size={12} aria-hidden="true" />
                      )}
                      <span className="sr-only">Copy variable</span>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
