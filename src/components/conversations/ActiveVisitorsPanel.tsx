/**
 * @fileoverview Active visitors panel showing real-time widget visitors.
 * Uses Supabase Realtime Presence to track visitors across agents,
 * displaying current page, lead info, and session duration.
 */

import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SectionHeader } from '@/components/ui/section-header';
import { Globe01, Users01 } from '@untitledui/icons';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { VisitorPresenceState } from '@/types/report';
import { cn } from '@/lib/utils';

interface ActiveVisitor {
  visitorId: string;
  agentId: string;
  agentName?: string;
  currentPage: string;
  leadName?: string;
  leadEmail?: string;
  startedAt: string;
}

interface ActiveVisitorsPanelProps {
  agentIds: string[];
  agentNames?: Record<string, string>;
  className?: string;
}

const formatUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    let path = parsed.pathname;
    if (path === '/') return '/';
    return path.length > 20 ? path.substring(0, 17) + '...' : path;
  } catch {
    return url.length > 20 ? url.substring(0, 17) + '...' : url;
  }
};

const formatTimeActive = (startedAt: string): string => {
  const start = new Date(startedAt);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  
  if (diffSecs < 60) return `${diffSecs}s`;
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m`;
  const hours = Math.floor(diffMins / 60);
  return `${hours}h ${diffMins % 60}m`;
};

export const ActiveVisitorsPanel: React.FC<ActiveVisitorsPanelProps> = ({ 
  agentIds, 
  agentNames = {},
  className 
}) => {
  const [activeVisitors, setActiveVisitors] = useState<ActiveVisitor[]>([]);
  const [, setUpdateTrigger] = useState(0);

  useEffect(() => {
    if (agentIds.length === 0) return;

    const channels: RealtimeChannel[] = [];

    agentIds.forEach(agentId => {
      const channel = supabase
        .channel(`visitor-presence-${agentId}`)
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const visitors: ActiveVisitor[] = [];
          
        Object.values(state).flat().forEach((rawPresence) => {
          const presence = rawPresence as unknown as VisitorPresenceState;
            if (presence.isWidgetOpen) {
              visitors.push({
                visitorId: presence.visitorId,
                agentId: agentId,
                agentName: agentNames[agentId],
                currentPage: presence.currentPage || 'Unknown',
                leadName: presence.leadName,
                leadEmail: presence.leadEmail,
                startedAt: presence.startedAt || new Date().toISOString(),
              });
            }
          });
          
          setActiveVisitors(prev => {
            const otherAgentVisitors = prev.filter(v => v.agentId !== agentId);
            return [...otherAgentVisitors, ...visitors];
          });
        })
        .subscribe();

      channels.push(channel);
    });

    // Update timestamps every 10 seconds
    const interval = setInterval(() => {
      setUpdateTrigger(prev => prev + 1);
    }, 10000);

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
      clearInterval(interval);
    };
  }, [agentIds.join(','), JSON.stringify(agentNames)]);

  return (
    <div className={cn("p-4 border-b", className)}>
      <div className="flex items-center justify-between mb-3">
        <SectionHeader className="mb-0">
          <Users01 className="h-4 w-4 inline mr-1.5" />
          Active Now
        </SectionHeader>
        <Badge 
          variant="secondary" 
          className={cn(
            "text-xs",
            activeVisitors.length > 0 && "bg-success/10 text-success"
          )}
        >
          {activeVisitors.length}
        </Badge>
      </div>

      {activeVisitors.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">
          No active visitors
        </p>
      ) : (
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {activeVisitors.map((visitor) => (
            <div
              key={visitor.visitorId}
              className="flex items-center gap-2 p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="relative shrink-0">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-2xs bg-primary/10">
                    {visitor.leadName?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border-2 border-background" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">
                  {visitor.leadName || visitor.leadEmail || 'Anonymous'}
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-2xs text-muted-foreground">
                      <Globe01 className="h-3 w-3 shrink-0" />
                      <span className="truncate">{formatUrl(visitor.currentPage)}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <span className="text-xs break-all">{visitor.currentPage}</span>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              <span className="text-2xs text-muted-foreground shrink-0">
                {formatTimeActive(visitor.startedAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
