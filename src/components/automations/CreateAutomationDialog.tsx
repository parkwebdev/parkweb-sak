/**
 * CreateAutomationDialog Component
 * 
 * Dialog for creating a new automation with name and trigger type.
 * 
 * @module components/automations/CreateAutomationDialog
 */

import { useState } from 'react';
import { Zap, Clock, Hand, Stars02 } from '@untitledui/icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { CreateAutomationData, AutomationTriggerType } from '@/types/automations';

interface CreateAutomationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateAutomationData) => Promise<void>;
  loading: boolean;
}

const TRIGGER_OPTIONS: Array<{
  type: AutomationTriggerType;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  {
    type: 'event',
    label: 'Event',
    description: 'Triggered by lead or conversation events',
    icon: Zap,
  },
  {
    type: 'schedule',
    label: 'Schedule',
    description: 'Run on a cron schedule',
    icon: Clock,
  },
  {
    type: 'manual',
    label: 'Manual',
    description: 'Triggered by user action',
    icon: Hand,
  },
  {
    type: 'ai_tool',
    label: 'Ari Action',
    description: 'Ari uses this during conversations',
    icon: Stars02,
  },
];

export function CreateAutomationDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
}: CreateAutomationDialogProps) {
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState<AutomationTriggerType>('event');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    await onSubmit({
      name: name.trim(),
      trigger_type: triggerType,
    });
    
    // Reset form
    setName('');
    setTriggerType('event');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Automation</DialogTitle>
            <DialogDescription>
              Give your automation a name and choose how it will be triggered.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name input */}
            <div className="space-y-2">
              <Label htmlFor="automation-name">Name</Label>
              <Input
                id="automation-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Automation"
                autoFocus
              />
            </div>

            {/* Trigger type selection */}
            <div className="space-y-2">
              <Label>Trigger Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {TRIGGER_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = triggerType === option.type;

                  return (
                    <button
                      key={option.type}
                      type="button"
                      onClick={() => setTriggerType(option.type)}
                      className={cn(
                        'p-3 rounded-lg border text-left transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        isSelected 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-muted-foreground/50'
                      )}
                    >
                      <Icon 
                        size={16} 
                        className={cn(
                          'mb-1.5',
                          isSelected ? 'text-primary' : 'text-muted-foreground'
                        )} 
                      />
                      <div className="text-sm font-medium text-foreground">
                        {option.label}
                      </div>
                      <div className="text-2xs text-muted-foreground mt-0.5">
                        {option.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || loading}>
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
