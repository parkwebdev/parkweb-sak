/**
 * AgentConfigHeader Component
 * 
 * Hero header for agent configuration page with dotted grid background.
 * Displays agent name, status badge, and description.
 * @module components/agents/AgentConfigHeader
 */

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft } from '@untitledui/icons';
import type { Tables } from '@/integrations/supabase/types';

type Agent = Tables<'agents'>;

interface AgentConfigHeaderProps {
  agent: Agent;
}

const statusColors = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
};

export const AgentConfigHeader = ({ agent }: AgentConfigHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="border-b">
      {/* Hero Section with Dotted Grid */}
      <div className="relative overflow-hidden">
        <div className="relative h-48 bg-neutral-100 dark:bg-neutral-950">
          {/* Dot Pattern Layer */}
          <div 
            className="absolute inset-0 [background-image:radial-gradient(circle,_rgba(0,_0,_0,_0.20)_1px,_transparent_1px)] dark:[background-image:radial-gradient(circle,_rgba(255,_255,_255,_0.15)_1px,_transparent_1px)]"
            style={{ backgroundSize: '12px 12px' }}
          />
          
          {/* Gradient Overlay - stronger at bottom for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neutral-100/50 to-neutral-100/90 dark:via-neutral-950/50 dark:to-neutral-950/90" />
          
          <div className="relative z-10 px-4 lg:px-8 py-4 h-full flex flex-col">
            {/* Top Row: Back button only */}
            <div className="flex items-center justify-between mb-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/agents')}
                className="h-8 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200/60 hover:backdrop-blur-sm hover:border hover:border-neutral-300 dark:text-white/90 dark:hover:text-white dark:hover:bg-white/15 dark:hover:border-white/20 transition-all"
              >
                <ChevronLeft size={16} />
                Back
              </Button>
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
