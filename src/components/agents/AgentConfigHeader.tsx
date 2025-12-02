import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, CheckCircle } from '@untitledui/icons';
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
    <div className="border-b">
      {/* Hero Section with Dotted Grid */}
      <div className="relative overflow-hidden">
        <div 
          className="relative h-48 bg-neutral-100 dark:bg-neutral-950"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(0, 0, 0, 0.15) 0.5px, transparent 0.5px)',
            backgroundSize: '12px 12px'
          }}
        >
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-neutral-200/40 dark:to-neutral-950/60" />
          
          <div 
            className="relative z-10 px-4 lg:px-8 py-4 h-full flex flex-col [background-image:radial-gradient(circle,_rgba(0,_0,_0,_0.15)_0.5px,_transparent_0.5px)] dark:[background-image:radial-gradient(circle,_rgba(255,_255,_255,_0.1)_0.5px,_transparent_0.5px)]"
            style={{ backgroundSize: '12px 12px' }}
          >
            {/* Top Row: Back button + Save controls */}
            <div className="flex items-center justify-between mb-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/agents')}
                className="h-8 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200/50 dark:text-white/90 dark:hover:text-white dark:hover:bg-white/10"
              >
                <ChevronLeft size={16} />
                Back
              </Button>

              <div className="flex items-center gap-2">
                {showSaved && (
                  <div className="flex items-center gap-1.5 text-xs text-neutral-700 dark:text-white/90 animate-fade-in">
                    <CheckCircle className="h-3 w-3" />
                    <span>Saved</span>
                  </div>
                )}
                {hasUnsavedChanges && onSave && (
                  <Button 
                    onClick={onSave} 
                    disabled={isSaving} 
                    size="sm"
                    className="bg-neutral-900/10 text-neutral-900 hover:bg-neutral-900/20 border-neutral-900/20 dark:bg-white/20 dark:text-white dark:hover:bg-white/30 dark:border-white/20"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                )}
              </div>
            </div>

            {/* Bottom: Agent info */}
            <div className="mt-auto">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-semibold text-neutral-900 dark:text-white drop-shadow-sm dark:drop-shadow-md">
                  {agent.name}
                </h1>
                <Badge 
                  variant="secondary" 
                  className={`${statusColors[agent.status]} shadow-sm`}
                >
                  {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                </Badge>
              </div>
              {agent.description && (
                <p className="text-sm text-neutral-700 dark:text-white/90 line-clamp-1 drop-shadow-sm dark:drop-shadow">
                  {agent.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
