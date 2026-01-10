/**
 * TemplateSelector Component
 * 
 * Displays automation templates organized by category for quick start.
 * 
 * @module components/automations/TemplateSelector
 */

import { useState } from 'react';
import { Mail01, Flag06, Stars02, MessageChatCircle, Link01, RefreshCw05, AlertCircle, Calendar } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AUTOMATION_TEMPLATES, type AutomationTemplate } from '@/lib/automation-templates';

const CATEGORY_LABELS: Record<string, { label: string; description: string }> = {
  'lead-management': { label: 'Lead Management', description: 'Automate lead workflows' },
  'ai-workflows': { label: 'AI Workflows', description: 'Use AI to classify and generate' },
  'notifications': { label: 'Notifications', description: 'Alert your team' },
  'integrations': { label: 'Integrations', description: 'Connect external services' },
};

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Mail01, Flag06, Stars02, MessageChatCircle, Link01, RefreshCw05, AlertCircle, Calendar,
};

interface TemplateSelectorProps {
  onSelect: (template: AutomationTemplate) => void;
  selectedId?: string;
}

export function TemplateSelector({ onSelect, selectedId }: TemplateSelectorProps) {
  const categories = Object.keys(CATEGORY_LABELS);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredTemplates = activeCategory 
    ? AUTOMATION_TEMPLATES.filter(t => t.category === activeCategory)
    : AUTOMATION_TEMPLATES;

  return (
    <div className="space-y-4">
      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={activeCategory === null ? 'default' : 'outline'}
          onClick={() => setActiveCategory(null)}
        >
          All
        </Button>
        {categories.map(cat => (
          <Button
            key={cat}
            size="sm"
            variant={activeCategory === cat ? 'default' : 'outline'}
            onClick={() => setActiveCategory(cat)}
          >
            {CATEGORY_LABELS[cat].label}
          </Button>
        ))}
      </div>

      {/* Templates grid */}
      <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-1">
        {filteredTemplates.map(template => {
          const IconComponent = ICON_MAP[template.icon] || Stars02;
          const isSelected = selectedId === template.id;

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template)}
              className={cn(
                'p-4 border rounded-lg text-left transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border hover:border-muted-foreground/50 hover:bg-muted/30'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'w-8 h-8 rounded-md flex items-center justify-center shrink-0',
                  `bg-${template.color}-500/10`
                )}>
                  <IconComponent size={16} className={`text-${template.color}-500`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">
                    {template.name}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {template.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
