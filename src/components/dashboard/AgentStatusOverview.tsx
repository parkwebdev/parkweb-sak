/**
 * @fileoverview Agent status overview card for dashboard.
 * Displays user's agents with status badges and active conversation counts.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cube01 as Bot, ChevronRight } from '@untitledui/icons';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';
import { logger } from '@/utils/logger';

interface Agent {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused';
  conversationCount: number;
}

export const AgentStatusOverview: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAgents();
    }
  }, [user]);

  const fetchAgents = async () => {
    if (!user) return;

    try {
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select('id, name, status')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(5);

      if (agentsError) throw agentsError;

      // Get conversation counts for each agent
      const agentIds = (agentsData || []).map(a => a.id);
      const { data: convCounts } = await supabase
        .from('conversations')
        .select('agent_id')
        .in('agent_id', agentIds)
        .eq('status', 'active');

      const countMap = (convCounts || []).reduce((acc, conv) => {
        acc[conv.agent_id] = (acc[conv.agent_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setAgents((agentsData || []).map(agent => ({
        ...agent,
        conversationCount: countMap[agent.id] || 0
      })));
    } catch (error) {
      logger.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Agent['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-success/10 text-success border-success/20">Active</Badge>;
      case 'paused':
        return <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">Paused</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Your Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-2 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Your Agents</CardTitle>
      </CardHeader>
      <CardContent>
        {agents.length === 0 ? (
          <div className="text-center py-6">
            <Bot className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No agents yet</p>
            <button 
              onClick={() => navigate('/agents')}
              className="text-sm text-primary hover:underline mt-1"
            >
              Create your first agent
            </button>
          </div>
        ) : (
          <AnimatedList className="space-y-2" staggerDelay={0.05}>
            {agents.map((agent) => (
              <AnimatedItem key={agent.id}>
                <button
                  onClick={() => navigate(`/agents/${agent.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-border hover:bg-muted/30 transition-all text-left group"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {agent.conversationCount} active conversation{agent.conversationCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(agent.status)}
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              </AnimatedItem>
            ))}
          </AnimatedList>
        )}
      </CardContent>
    </Card>
  );
};
