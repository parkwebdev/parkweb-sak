/**
 * PromptVersionHistory Component
 * 
 * Displays version history for the baseline prompt.
 * 
 * @module components/admin/prompts/PromptVersionHistory
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

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
