import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, CheckCircle } from '@untitledui/icons';
import { DottedGlowBackground } from '@/components/ui/dotted-glow-background';
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
      {/* Hero Section with Background Beams */}
      <div className="relative overflow-hidden">
        <div className="relative h-40 bg-neutral-950">
          <DottedGlowBackground 
            className="absolute inset-0"
            glowColor="rgba(0, 170, 255, 0.85)"
            color="rgba(255, 255, 255, 0.5)"
            darkColor="rgba(255, 255, 255, 0.7)"
            gap={24}
            radius={1}
            opacity={0.8}
          />
          <div className="relative z-10 px-4 lg:px-8 py-4 h-full flex flex-col">
            {/* Top Row: Back button + Save controls */}
            <div className="flex items-center justify-between mb-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/agents')}
                className="h-8 text-white/90 hover:text-white hover:bg-white/10"
              >
                <ChevronLeft size={16} />
                Back
              </Button>

              <div className="flex items-center gap-2">
                {showSaved && (
                  <div className="flex items-center gap-1.5 text-xs text-white/90 animate-fade-in">
                    <CheckCircle className="h-3 w-3" />
                    <span>Saved</span>
                  </div>
                )}
                {hasUnsavedChanges && onSave && (
                  <Button 
                    onClick={onSave} 
                    disabled={isSaving} 
                    size="sm"
                    className="bg-white/20 text-white hover:bg-white/30 border-white/20"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                )}
              </div>
            </div>

            {/* Bottom: Agent info */}
            <div className="mt-auto">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-semibold text-white drop-shadow-md">
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
                <p className="text-sm text-white/90 line-clamp-1 drop-shadow">
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
