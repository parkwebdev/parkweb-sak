/**
 * UrlPatternsEditor Component
 * 
 * Manages URL patterns for automatic location routing.
 * 
 * @module components/agents/locations/UrlPatternsEditor
 */

import React, { useState } from 'react';
import { Plus, XClose } from '@untitledui/icons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface UrlPatternsEditorProps {
  value: string[];
  onChange: (patterns: string[]) => void;
}

export const UrlPatternsEditor: React.FC<UrlPatternsEditorProps> = ({
  value,
  onChange,
}) => {
  const [newPattern, setNewPattern] = useState('');

  const addPattern = () => {
    const pattern = newPattern.trim();
    if (pattern && !value.includes(pattern)) {
      onChange([...value, pattern]);
      setNewPattern('');
    }
  };

  const removePattern = (pattern: string) => {
    onChange(value.filter((p) => p !== pattern));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addPattern();
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing patterns */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((pattern) => (
            <Badge
              key={pattern}
              variant="secondary"
              className="pl-2.5 pr-1 py-1 flex items-center gap-1"
            >
              <code className="text-xs">{pattern}</code>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1 hover:bg-destructive/20"
                onClick={() => removePattern(pattern)}
              >
                <XClose size={12} />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Add new pattern */}
      <div className="flex gap-2">
        <Input
          value={newPattern}
          onChange={(e) => setNewPattern(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., /downtown/* or example.com/austin"
          className="flex-1"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={addPattern}
          disabled={!newPattern.trim()}
        >
          <Plus size={14} className="mr-1" />
          Add
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Use wildcards (*) to match multiple pages. Widget conversations from matching URLs will route to this location.
      </p>
    </div>
  );
};
