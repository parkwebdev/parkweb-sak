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
