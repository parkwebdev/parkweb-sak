/**
 * FlowEmptyState Component
 * 
 * Displays guidance when the automation canvas is empty.
 * Helps users get started with triggers and templates.
 * 
 * @module components/automations/FlowEmptyState
 */

import { memo } from 'react';
import { Zap, Clock, Hand, Stars02 } from '@untitledui/icons';
import { cn } from '@/lib/utils';

interface TriggerOption {
  type: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  description: string;
  color: string;
}

const TRIGGER_OPTIONS: TriggerOption[] = [
  {
    type: 'trigger-event',
    icon: Zap,
    label: 'When Something Happens',
    description: 'Lead created, booking made, etc.',
    color: 'bg-amber-500',
  },
  {
    type: 'trigger-schedule',
    icon: Clock,
    label: 'On a Schedule',
    description: 'Run daily, weekly, etc.',
    color: 'bg-blue-500',
  },
  {
    type: 'trigger-manual',
    icon: Hand,
    label: 'When I Click Run',
    description: 'Trigger manually from dashboard',
    color: 'bg-green-500',
  },
  {
    type: 'trigger-ai-tool',
    icon: Stars02,
    label: 'When Ari Decides',
    description: 'Let AI trigger this action',
    color: 'bg-violet-500',
  },
];

interface FlowEmptyStateProps {
  onAddTrigger: (type: string) => void;
}

export const FlowEmptyState = memo(function FlowEmptyState({ onAddTrigger }: FlowEmptyStateProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <div className="bg-card border border-border rounded-xl shadow-lg p-8 max-w-lg pointer-events-auto">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Zap size={24} className="text-primary" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Build Your Automation
          </h2>
          <p className="text-sm text-muted-foreground">
            Every automation starts with a trigger. Pick what should kick things off:
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {TRIGGER_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.type}
                type="button"
                onClick={() => onAddTrigger(option.type)}
                className={cn(
                  'flex flex-col items-start p-4 rounded-lg border-2 border-muted',
                  'hover:border-primary hover:bg-accent/50 transition-all',
                  'text-left group cursor-pointer'
                )}
              >
                <div className={cn('w-8 h-8 rounded-md flex items-center justify-center mb-2', option.color)}>
                  <Icon size={16} className="text-white" aria-hidden="true" />
                </div>
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {option.label}
                </span>
                <span className="text-2xs text-muted-foreground mt-0.5">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Or drag nodes from the sidebar on the left to build your flow
          </p>
        </div>
      </div>
    </div>
  );
});
