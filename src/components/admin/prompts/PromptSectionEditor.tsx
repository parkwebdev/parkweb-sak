/**
 * PromptSectionEditor Component
 * 
 * Reusable accordion-style section editor for prompt configuration.
 * 
 * @module components/admin/prompts/PromptSectionEditor
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ChevronDown, RefreshCw01, Check } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { springs } from '@/lib/motion-variants';
import { useAutoSave } from '@/hooks/useAutoSave';

interface PromptSectionEditorProps {
  /** Section title */
  title: string;
  /** Section description */
  description: string;
  /** Current value */
  value: string;
  /** Default value for reset */
  defaultValue: string;
  /** Callback when value changes */
  onSave: (value: string) => Promise<void>;
  /** Loading state */
  loading?: boolean;
  /** Version number */
  version?: number;
  /** Last updated timestamp */
  lastUpdated?: string;
  /** Minimum height for textarea */
  minHeight?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Initially expanded */
  defaultExpanded?: boolean;
}

/**
 * Accordion-style section editor with auto-save.
 */
export function PromptSectionEditor({
  title,
  description,
  value,
  defaultValue,
  onSave,
  loading,
  version,
  lastUpdated,
  minHeight = '200px',
  placeholder,
  defaultExpanded = false,
}: PromptSectionEditorProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [localValue, setLocalValue] = useState(value);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync local value with prop
  useEffect(() => {
    setLocalValue(value);
    setHasChanges(false);
  }, [value]);

  // Auto-save hook
  const { save, status } = useAutoSave({
    onSave: async (newValue: string) => {
      await onSave(newValue);
      setHasChanges(false);
    },
    debounceMs: 1500,
  });

  const handleChange = useCallback((newValue: string) => {
    setLocalValue(newValue);
    setHasChanges(newValue !== value);
    save(newValue);
  }, [value, save]);

  const handleReset = useCallback(() => {
    setLocalValue(defaultValue);
    setHasChanges(defaultValue !== value);
    save(defaultValue);
  }, [defaultValue, value, save]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <div className="p-4">
          <Skeleton className="h-5 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="rounded-lg border border-border bg-card overflow-hidden"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.smooth}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">{title}</h3>
            {version !== undefined && (
              <Badge variant="secondary" size="sm">v{version}</Badge>
            )}
            {hasChanges && status !== 'saving' && (
              <Badge variant="outline" size="sm" className="text-amber-600 border-amber-300">
                Unsaved
              </Badge>
            )}
            {status === 'saving' && (
              <Badge variant="outline" size="sm" className="text-blue-600 border-blue-300">
                Saving...
              </Badge>
            )}
            {status === 'saved' && !hasChanges && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Check size={14} className="text-status-active" aria-hidden="true" />
              </motion.span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={springs.snappy}
        >
          <ChevronDown size={16} className="text-muted-foreground" aria-hidden="true" />
        </motion.div>
      </button>

      {/* Content */}
      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? 'auto' : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={springs.smooth}
        className="overflow-hidden"
      >
        <div className="px-4 pb-4 space-y-3">
          <Textarea
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            className="font-mono text-xs"
            style={{ minHeight }}
          />
          
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {lastUpdated && (
                <span>Last updated: {new Date(lastUpdated).toLocaleDateString()}</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={localValue === defaultValue}
              className="text-xs"
            >
              <RefreshCw01 size={14} className="mr-1" aria-hidden="true" />
              Reset to default
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
