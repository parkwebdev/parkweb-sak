/**
 * PromptMetrics Component
 * 
 * Displays character count, estimated tokens, and length status.
 * 
 * @module components/admin/prompts/PromptMetrics
 */

import { cn } from '@/lib/utils';
import {
  MAX_PROMPT_CHARS,
  WARN_PROMPT_CHARS,
  estimateTokenCount,
  getPromptLengthStatus,
} from '@/lib/prompt-validation';

interface PromptMetricsProps {
  content: string;
  maxChars?: number;
  warnAt?: number;
  className?: string;
}

export function PromptMetrics({
  content,
  maxChars = MAX_PROMPT_CHARS,
  warnAt = WARN_PROMPT_CHARS,
  className,
}: PromptMetricsProps) {
  const charCount = content.length;
  const tokenEstimate = estimateTokenCount(content);
  const status = getPromptLengthStatus(charCount);

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-xs tabular-nums',
        status === 'ok' && 'text-muted-foreground',
        status === 'warning' && 'text-warning',
        status === 'error' && 'text-destructive',
        className
      )}
    >
      <span>
        {charCount.toLocaleString()} / {maxChars.toLocaleString()} chars
      </span>
      <span className="text-muted-foreground">•</span>
      <span className="text-muted-foreground">
        ~{tokenEstimate.toLocaleString()} tokens
      </span>
    </div>
  );
}
