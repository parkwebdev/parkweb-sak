/**
 * AdminPromptPreviewPanel Component
 * 
 * Right-side panel with tabbed interface for prompt preview and testing.
 * Matches the AriPreviewColumn design pattern.
 * 
 * @module components/admin/prompts/AdminPromptPreviewPanel
 */

import { useMemo, useState } from 'react';
import { Copy01, Check } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { PromptTestChat } from './PromptTestChat';

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
    { id: 'identity', title: 'Identity', content: sections.identity },
    { id: 'formatting', title: 'Formatting', content: sections.formatting },
    { id: 'security', title: 'Security', content: sections.security },
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
      <div className="w-[360px] flex-shrink-0 border-l border-border bg-card p-4">
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
    <div className="w-[360px] flex-shrink-0 border-l border-border bg-card flex flex-col h-full">
      <Tabs defaultValue="preview" className="flex flex-col h-full">
        {/* Header with tabs */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <TabsList className="h-8">
            <TabsTrigger value="preview" className="text-xs px-3">
              Preview
            </TabsTrigger>
            <TabsTrigger value="test" className="text-xs px-3">
              Test
            </TabsTrigger>
          </TabsList>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="text-xs h-7 px-2"
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

        {/* Preview Tab */}
        <TabsContent value="preview" className="flex-1 flex flex-col mt-0 data-[state=inactive]:hidden">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {previewSections.map((section) => (
                <div
                  key={section.id}
                  className={cn(
                    'rounded-lg border p-3',
                    section.content?.trim() 
                      ? 'border-border bg-background' 
                      : 'border-dashed border-muted-foreground/30 bg-muted/30'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      {section.title}
                    </span>
                    {!section.content?.trim() && (
                      <Badge variant="outline" size="sm" className="text-muted-foreground text-2xs">
                        Empty
                      </Badge>
                    )}
                  </div>
                  {section.content?.trim() ? (
                    <pre className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed max-h-[120px] overflow-y-auto">
                      {section.content.length > 200 
                        ? `${section.content.slice(0, 200)}...` 
                        : section.content}
                    </pre>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      Not configured
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Footer stats */}
          <div className="px-4 py-3 border-t border-border bg-muted/30">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total</span>
              <span className="font-mono">{fullPrompt.length.toLocaleString()} chars</span>
            </div>
          </div>
        </TabsContent>

        {/* Test Tab */}
        <TabsContent value="test" className="flex-1 flex flex-col mt-0 data-[state=inactive]:hidden">
          <PromptTestChat baselinePrompt={fullPrompt} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
