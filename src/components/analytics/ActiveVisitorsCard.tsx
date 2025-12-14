/**
 * ActiveVisitorsCard Component
 * 
 * Real-time display of active visitors for the single Ari agent.
 * Uses Supabase presence channel for live updates.
 * @module components/analytics/ActiveVisitorsCard
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Users01, Globe01 } from '@untitledui/icons';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { VisitorPresenceState } from '@/types/report';

interface ActiveVisitor {
  visitorId: string;
  currentPage: string;
  leadName?: string;
  leadEmail?: string;
  startedAt: string;
}

interface ActiveVisitorsCardProps {
  agentId?: string | null;
}

const formatUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    let path = parsed.pathname;
    if (path === '/') return '/';
    return path.length > 25 ? path.substring(0, 22) + '...' : path;
  } catch {
    return url.length > 25 ? url.substring(0, 22) + '...' : url;
  }
};

const formatTimeActive = (startedAt: string): string => {
  const start = new Date(startedAt);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  const hours = Math.floor(diffMins / 60);
  return `${hours}h ${diffMins % 60}m`;
};

export const ActiveVisitorsCard: React.FC<ActiveVisitorsCardProps> = ({ agentId }) => {
  const [activeVisitors, setActiveVisitors] = useState<ActiveVisitor[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!agentId) return;

    const newChannel = supabase
      .channel(`visitor-presence-${agentId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = newChannel.presenceState();
        const visitors: ActiveVisitor[] = [];
        
        Object.values(state).flat().forEach((rawPresence) => {
          const presence = rawPresence as unknown as VisitorPresenceState;
          if (presence.isWidgetOpen) {
            visitors.push({
              visitorId: presence.visitorId,
              currentPage: presence.currentPage || 'Unknown',
              leadName: presence.leadName,
              leadEmail: presence.leadEmail,
              startedAt: presence.startedAt || new Date().toISOString(),
            });
          }
        });
        
        setActiveVisitors(visitors);
      })
      .subscribe();

    setChannel(newChannel);

    return () => {
      supabase.removeChannel(newChannel);
    };
  }, [agentId]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users01 className="h-4 w-4" />
            Active Visitors
          </CardTitle>
          <Badge 
            variant="secondary" 
            className={activeVisitors.length > 0 ? 'bg-success/10 text-success' : ''}
          >
            {activeVisitors.length} online
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {activeVisitors.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No active visitors right now
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {activeVisitors.map((visitor) => (
              <div
                key={visitor.visitorId}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10">
                      {visitor.leadName?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-background" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {visitor.leadName || visitor.leadEmail || 'Anonymous'}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Globe01 className="h-3 w-3" />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="truncate">{formatUrl(visitor.currentPage)}</span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <span className="text-xs break-all">{visitor.currentPage}</span>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">
                    {formatTimeActive(visitor.startedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
