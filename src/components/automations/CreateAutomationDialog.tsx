/**
 * CreateAutomationDialog Component
 * 
 * Dialog for creating a new automation with name and trigger type,
 * or from a pre-built template.
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { TemplateSelector } from './TemplateSelector';
import type { CreateAutomationData, AutomationTriggerType } from '@/types/automations';
import type { AutomationTemplate } from '@/lib/automation-templates';

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
  const [activeTab, setActiveTab] = useState<'scratch' | 'template'>('scratch');
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState<AutomationTriggerType>('event');
  const [selectedTemplate, setSelectedTemplate] = useState<AutomationTemplate | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === 'template' && selectedTemplate) {
      // Create from template
      await onSubmit({
        name: name.trim() || selectedTemplate.name,
        description: selectedTemplate.description,
        icon: selectedTemplate.icon,
        color: selectedTemplate.color,
        trigger_type: selectedTemplate.triggerType,
        templateId: selectedTemplate.id,
      });
    } else {
      // Create from scratch
      if (!name.trim()) return;
      
      await onSubmit({
        name: name.trim(),
        trigger_type: triggerType,
      });
    }
    
    // Reset form
    setName('');
    setTriggerType('event');
    setSelectedTemplate(null);
    setActiveTab('scratch');
  };

  const handleTemplateSelect = (template: AutomationTemplate) => {
    setSelectedTemplate(template);
    // Pre-fill name if empty
    if (!name.trim()) {
      setName(template.name);
    }
  };

  const canSubmit = activeTab === 'template' 
    ? !!selectedTemplate 
    : !!name.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Automation</DialogTitle>
            <DialogDescription>
              Start from scratch or use a template to get going quickly.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'scratch' | 'template')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="scratch">Start from scratch</TabsTrigger>
                <TabsTrigger value="template">Use a template</TabsTrigger>
              </TabsList>

              <TabsContent value="scratch" className="mt-4 space-y-4">
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
              </TabsContent>

              <TabsContent value="template" className="mt-4 space-y-4">
                {/* Name override input */}
                <div className="space-y-2">
                  <Label htmlFor="template-name">Name (optional override)</Label>
                  <Input
                    id="template-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={selectedTemplate?.name || 'Use template name'}
                  />
                </div>

                {/* Template selector */}
                <div className="space-y-2">
                  <Label>Choose a template</Label>
                  <TemplateSelector 
                    onSelect={handleTemplateSelect}
                    selectedId={selectedTemplate?.id}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit || loading}>
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
