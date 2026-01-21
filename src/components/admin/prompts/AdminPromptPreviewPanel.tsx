/**
 * AdminPromptPreviewPanel Component
 * 
 * Right-side panel showing the assembled system prompt preview.
 * 
 * @module components/admin/prompts/AdminPromptPreviewPanel
 */

import { useMemo, useState } from 'react';
import { Copy01, Check } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface PromptSections {
  identity: string;
  formatting: string;
  security: string;
  language: string;
}

interface AdminPromptPreviewPanelProps {
  sections: PromptSections;
  loading?: boolean;
}

interface PreviewSection {
  id: string;
  title: string;
  content: string;
}

export function AdminPromptPreviewPanel({
  sections,
  loading,
}: AdminPromptPreviewPanelProps) {
  const [copied, setCopied] = useState(false);

  const previewSections: PreviewSection[] = useMemo(() => [
    { id: 'identity', title: 'Identity & Role', content: sections.identity },
    { id: 'formatting', title: 'Response Formatting', content: sections.formatting },
    { id: 'security', title: 'Security Guardrails', content: sections.security },
    { id: 'language', title: 'Language', content: sections.language },
  ], [sections]);

  const fullPrompt = useMemo(() => {
    return previewSections
      .filter(s => s.content?.trim())
      .map(s => s.content)
      .join('\n\n');
  }, [previewSections]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="w-[360px] flex-shrink-0 border-l border-border bg-muted/30 p-4">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-[360px] flex-shrink-0 border-l border-border bg-muted/30 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h3 className="text-sm font-medium">Prompt Preview</h3>
          <p className="text-xs text-muted-foreground">Assembled system prompt</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="text-xs"
        >
        {copied ? (
            <>
              <Check size={14} className="mr-1" aria-hidden="true" />
              Copied
            </>
          ) : (
            <>
              <Copy01 size={14} className="mr-1" aria-hidden="true" />
              Copy
            </>
          )}
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {previewSections.map((section) => (
            <div
              key={section.id}
              className={cn(
                'rounded-lg border bg-background p-3',
                section.content?.trim() ? 'border-border' : 'border-dashed border-muted-foreground/30'
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {section.title}
                </span>
                {!section.content?.trim() && (
                  <Badge variant="outline" size="sm" className="text-muted-foreground">
                    Empty
                  </Badge>
                )}
              </div>
              {section.content?.trim() ? (
                <pre className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed max-h-[200px] overflow-y-auto">
                  {section.content}
                </pre>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  No content configured
                </p>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer stats */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Total characters</span>
          <span className="font-mono">{fullPrompt.length.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
