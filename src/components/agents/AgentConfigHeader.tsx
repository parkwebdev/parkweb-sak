import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft } from '@untitledui/icons';
import { SavedIndicator } from '@/components/settings/SavedIndicator';
import { BubbleBackground } from '@/components/ui/bubble-background';
import { hexToRgb } from '@/lib/color-utils';
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

  // Extract gradient colors from deployment config
  const deploymentConfig = agent.deployment_config as any;
  const embeddedChat = deploymentConfig?.embedded_chat || {};
  const gradientStartColor = embeddedChat.gradientStartColor || '#000000';
  const gradientEndColor = embeddedChat.gradientEndColor || '#1e40af';

  // Convert hex to RGB for BubbleBackground
  const startRgb = hexToRgb(gradientStartColor, '0,0,0');
  const endRgb = hexToRgb(gradientEndColor, '30,64,175');

  return (
    <div className="border-b">
      {/* Top Row: Back button + Save controls */}
      <div className="px-4 lg:px-8 py-3 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/agents')}
          className="h-8"
        >
          <ChevronLeft size={16} />
          Back
        </Button>

        <div className="flex items-center gap-2">
          <SavedIndicator show={showSaved} />
          {hasUnsavedChanges && onSave && (
            <Button onClick={onSave} disabled={isSaving} size="sm">
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>
      </div>

      {/* Hero Section with Animated Gradient */}
      <div className="relative overflow-hidden">
        <BubbleBackground
          colors={{
            first: startRgb,
            second: endRgb,
            third: startRgb,
            fourth: endRgb,
            fifth: startRgb,
            sixth: endRgb,
          }}
          interactive={false}
          className="h-32"
        >
          <div className="relative z-10 px-4 lg:px-8 h-full flex items-center">
            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 min-w-0">
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
        </BubbleBackground>
      </div>
    </div>
  );
};
