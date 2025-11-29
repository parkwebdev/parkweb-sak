import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft } from '@untitledui/icons';
import { SavedIndicator } from '@/components/settings/SavedIndicator';
import type { Tables } from '@/integrations/supabase/types';

type Agent = Tables<'agents'>;

interface AgentConfigHeaderProps {
  agent: Agent;
  hasUnsavedChanges: boolean;
  showSaved: boolean;
  onSave?: () => void;
  isSaving?: boolean;
}

const statusColors = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
};

export const AgentConfigHeader = ({
  agent,
  hasUnsavedChanges,
  showSaved,
  onSave,
  isSaving,
}: AgentConfigHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="border-b bg-background">
      <div className="px-4 lg:px-8 py-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Back button + Agent info */}
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/agents')}
              className="shrink-0 h-8"
            >
              <ChevronLeft size={16} />
              Back
            </Button>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-lg font-semibold truncate">{agent.name}</h1>
                <Badge variant="secondary" className={statusColors[agent.status]}>
                  {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                </Badge>
              </div>
              {agent.description && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {agent.description}
                </p>
              )}
            </div>
          </div>

          {/* Right: Save indicator + Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <SavedIndicator show={showSaved} />
            
            {hasUnsavedChanges && onSave && (
              <Button onClick={onSave} disabled={isSaving} size="sm">
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
