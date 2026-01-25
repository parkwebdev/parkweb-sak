/**
 * IdentitySection Component
 * 
 * Editor for the Identity & Role prompt section.
 * 
 * @module components/admin/prompts/sections/IdentitySection
 */

import { useState, useEffect, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LightbulbIcon, LightbulbIconFilled } from '@/components/ui/lightbulb-icon';
import { useAutoSave } from '@/hooks/useAutoSave';
import { AdminSectionHeader } from '../AdminSectionHeader';

interface IdentitySectionProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  loading?: boolean;
  version?: number;
  lastUpdated?: string;
}

const IDENTITY_TIPS = [
  'Use first person ("I am...") for natural personality',
  'Define clear behavioral boundaries',
  'Specify expertise areas and limitations',
  'Keep the core identity concise but complete',
];

export function IdentitySection({
  value,
  onSave,
  loading,
  version,
  lastUpdated,
}: IdentitySectionProps) {
  const [localValue, setLocalValue] = useState(value);
  const [hasChanges, setHasChanges] = useState(false);
  const [isHoveringTip, setIsHoveringTip] = useState(false);

  useEffect(() => {
    setLocalValue(value);
    setHasChanges(false);
  }, [value]);

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

  if (loading) {
    return (
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-72 mb-6" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  return (
    <div>
      <AdminSectionHeader
        title="Identity & Role"
        description="The foundational prompt that defines who Ari is and how it behaves"
        lastUpdated={lastUpdated}
        status={status}
        hasChanges={hasChanges}
        extra={
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                  onMouseEnter={() => setIsHoveringTip(true)}
                  onMouseLeave={() => setIsHoveringTip(false)}
                >
                  {isHoveringTip ? (
                    <LightbulbIconFilled className="w-4 h-4 text-warning" />
                  ) : (
                    <LightbulbIcon className="w-4 h-4" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs p-3">
                <p className="font-medium text-xs mb-1">Identity Tips</p>
                <ul className="text-xs space-y-0.5 text-muted-foreground">
                  {IDENTITY_TIPS.map((tip, i) => (
                    <li key={i}>• {tip}</li>
                  ))}
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        }
      />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="identity-prompt" className="text-sm font-medium">
            Base Personality
          </Label>
          <Textarea
            id="identity-prompt"
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="You are Ari, a helpful AI assistant..."
            rows={14}
            className="font-mono text-sm resize-y min-h-[200px]"
          />
        </div>
      </div>
    </div>
  );
}
