/**
 * FullPromptPreview Component
 * 
 * Displays the complete assembled system prompt with all sections.
 * 
 * @module components/admin/prompts/FullPromptPreview
 */

import { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Copy01, Check } from '@untitledui/icons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { springs } from '@/lib/motion-variants';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface PromptSection {
  id: string;
  title: string;
  content: string;
  type: 'platform' | 'dynamic' | 'customer';
  description?: string;
}

interface FullPromptPreviewProps {
  /** Identity/baseline prompt content */
  identityPrompt: string;
  /** Response formatting rules */
  formattingRules: string;
  /** Security guardrails */
  securityGuardrails: string;
  /** Language instruction */
  languageInstruction: string;
  /** Loading state */
  loading?: boolean;
}

/**
 * Full prompt preview showing all assembled sections.
 */
export function FullPromptPreview({
  identityPrompt,
  formattingRules,
  securityGuardrails,
  languageInstruction,
  loading,
}: FullPromptPreviewProps) {
  const prefersReducedMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);

  const sections: PromptSection[] = useMemo(() => [
    {
      id: 'identity',
      title: 'Platform Baseline (Identity & Role)',
      content: identityPrompt || '[Not configured]',
      type: 'platform',
      description: 'Controlled by super admins',
    },
    {
      id: 'customer',
      title: 'Customer System Prompt',
      content: '[Added by customer in their Ari settings]',
      type: 'customer',
      description: 'Configured per account',
    },
    {
      id: 'knowledge',
      title: 'Knowledge Base Context',
      content: '[Injected from RAG search results based on user query]',
      type: 'dynamic',
      description: 'Retrieved at runtime',
    },
    {
      id: 'user',
      title: 'User Information',
      content: '[Extracted from conversation metadata: name, email, location, custom fields]',
      type: 'dynamic',
      description: 'From contact form data',
    },
    {
      id: 'memories',
      title: 'Remembered Context',
      content: '[Retrieved from semantic memory based on query similarity]',
      type: 'dynamic',
      description: 'From previous conversations',
    },
    {
      id: 'formatting',
      title: 'Response Formatting Rules',
      content: formattingRules || '[Not configured]',
      type: 'platform',
      description: 'Controlled by super admins',
    },
    {
      id: 'security',
      title: 'Security Guardrails',
      content: securityGuardrails || '[Not configured]',
      type: 'platform',
      description: 'Controlled by super admins',
    },
    {
      id: 'language',
      title: 'Language Instruction',
      content: languageInstruction || '[Not configured]',
      type: 'platform',
      description: 'Controlled by super admins',
    },
  ], [identityPrompt, formattingRules, securityGuardrails, languageInstruction]);

  const fullPrompt = useMemo(() => {
    return sections
      .filter(s => s.type === 'platform' && s.content && !s.content.startsWith('['))
      .map(s => s.content)
      .join('\n\n');
  }, [sections]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTypeStyles = (type: PromptSection['type']) => {
    switch (type) {
      case 'platform':
        return 'border-l-primary bg-primary/5';
      case 'customer':
        return 'border-l-accent bg-accent/5';
      case 'dynamic':
        return 'border-l-muted-foreground/30 bg-muted/30';
    }
  };

  const getTypeBadge = (type: PromptSection['type']) => {
    switch (type) {
      case 'platform':
        return <Badge variant="default" size="sm">Platform</Badge>;
      case 'customer':
        return <Badge variant="secondary" size="sm">Customer</Badge>;
      case 'dynamic':
        return <Badge variant="outline" size="sm">Dynamic</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.smooth}
    >
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-base">Full Prompt Assembly</CardTitle>
            <CardDescription>
              How the complete system prompt is constructed at runtime
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="shrink-0"
          >
            {copied ? (
              <>
                <Check size={14} className="mr-1" aria-hidden="true" />
                Copied
              </>
            ) : (
              <>
                <Copy01 size={14} className="mr-1" aria-hidden="true" />
                Copy Platform Sections
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {sections.map((section, index) => (
                <motion.div
                  key={section.id}
                  initial={prefersReducedMotion ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...springs.smooth, delay: index * 0.05 }}
                  className={cn(
                    'rounded-lg border-l-4 p-4',
                    getTypeStyles(section.type)
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">
                        {index + 1}.
                      </span>
                      <h4 className="text-sm font-medium">{section.title}</h4>
                    </div>
                    {getTypeBadge(section.type)}
                  </div>
                  {section.description && (
                    <p className="text-xs text-muted-foreground mb-2">
                      {section.description}
                    </p>
                  )}
                  <pre className="text-xs font-mono whitespace-pre-wrap text-foreground/80 bg-background/50 rounded p-3 max-h-40 overflow-auto">
                    {section.content}
                  </pre>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
}
