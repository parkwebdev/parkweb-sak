/**
 * PromptPreview Component
 * 
 * Displays a preview of the combined prompt.
 * 
 * @module components/admin/prompts/PromptPreview
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface PromptPreviewProps {
  /** The prompt content to display */
  prompt: string;
}

/**
 * Prompt preview component showing the combined prompt.
 */
export function PromptPreview({ prompt }: PromptPreviewProps) {
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
