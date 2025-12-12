/**
 * AgentCard Component
 * 
 * Card display for an AI agent with status, model info, and deployment badges.
 * Includes dropdown menu for configure, pause/activate, and delete actions.
 * @module components/agents/AgentCard
 */

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DotsHorizontal, Play, PauseCircle, Trash01 } from '@untitledui/icons';
import { useNavigate } from 'react-router-dom';
import type { Tables } from '@/integrations/supabase/types';
import type { AgentDeploymentConfig } from '@/types/metadata';

type Agent = Tables<'agents'>;

interface AgentCardProps {
  agent: Agent;
  onEdit: (agent: Agent) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: 'draft' | 'active' | 'paused') => void;
}

export const AgentCard = ({ agent, onEdit, onDelete, onStatusChange }: AgentCardProps) => {
  const navigate = useNavigate();
  const statusColors = {
    draft: 'bg-muted text-muted-foreground',
    active: 'bg-success/10 text-success border-success/20',
    paused: 'bg-warning/10 text-warning border-warning/20',
  };

  const deploymentConfig = (agent.deployment_config || {}) as AgentDeploymentConfig;
  const isDeployed = deploymentConfig?.api_enabled || deploymentConfig?.widget_enabled || deploymentConfig?.hosted_page_enabled;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-sm">{agent.name}</CardTitle>
              <Badge variant="outline" className={statusColors[agent.status]}>
                {agent.status}
              </Badge>
            </div>
            {agent.description && (
              <CardDescription className="line-clamp-2 text-xs">{agent.description}</CardDescription>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <DotsHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/agents/${agent.id}`)}>
                Configure
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {agent.status === 'active' ? (
                <DropdownMenuItem onClick={() => onStatusChange(agent.id, 'paused')}>
                  Pause
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onStatusChange(agent.id, 'active')}>
                  Activate
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(agent.id)} className="text-destructive">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Model:</span>
          <span className="font-mono text-xs">{agent.model}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Temperature:</span>
          <span>{agent.temperature}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Max Tokens:</span>
          <span>{agent.max_tokens}</span>
        </div>

        {isDeployed && (
          <div className="pt-2 mt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-1">Deployed:</p>
            <div className="flex flex-wrap gap-1">
              {deploymentConfig?.api_enabled && (
                <Badge variant="secondary" className="text-xs">API</Badge>
              )}
              {deploymentConfig?.widget_enabled && (
                <Badge variant="secondary" className="text-xs">Widget</Badge>
              )}
              {deploymentConfig?.hosted_page_enabled && (
                <Badge variant="secondary" className="text-xs">Hosted Page</Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button variant="outline" size="sm" onClick={() => navigate(`/agents/${agent.id}`)} className="w-full">
          Configure Agent
        </Button>
      </CardFooter>
    </Card>
  );
};
