/**
 * AutomationsEmptyState Component
 * 
 * Shown when no automations exist yet.
 * 
 * @module components/automations/AutomationsEmptyState
 */

import { Dataflow02, Plus } from '@untitledui/icons';
import { Button } from '@/components/ui/button';

interface AutomationsEmptyStateProps {
  onCreateClick: () => void;
}

export function AutomationsEmptyState({ onCreateClick }: AutomationsEmptyStateProps) {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Dataflow02 size={32} className="text-primary" />
        </div>
        
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Create your first automation
        </h2>
        
        <p className="text-muted-foreground text-sm mb-6">
          Automations let you build visual workflows that respond to events, 
          run on schedules, or integrate with your AI agent.
        </p>

        <Button onClick={onCreateClick} size="lg">
          <Plus size={20} className="mr-2" aria-hidden="true" />
          Create Automation
        </Button>
      </div>
    </div>
  );
}
