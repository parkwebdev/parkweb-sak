/**
 * @fileoverview Recent activity feed for dashboard.
 * Shows latest conversations, leads, and agents with timestamps and navigation.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { 
  MessageChatSquare, 
  UserPlus01 as UserPlus, 
  Cube01 as Bot,
  ChevronRight
} from '@untitledui/icons';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';
import { logger } from '@/utils/logger';

interface ActivityItem {
  id: string;
  type: 'conversation' | 'lead' | 'agent';
  title: string;
  description: string;
  timestamp: string;
  link?: string;
}

export const RecentActivity: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRecentActivity();
    }
  }, [user]);

  const fetchRecentActivity = async () => {
    if (!user) return;

    try {
      const [conversationsRes, leadsRes, agentsRes] = await Promise.all([
        supabase
          .from('conversations')
          .select('id, created_at, status, metadata')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('leads')
          .select('id, name, email, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('agents')
          .select('id, name, created_at, status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(2),
      ]);

      const items: ActivityItem[] = [];

      // Add conversations
      (conversationsRes.data || []).forEach(conv => {
        items.push({
          id: `conv-${conv.id}`,
          type: 'conversation',
          title: 'New conversation',
          description: conv.status === 'human_takeover' ? 'Requires attention' : conv.status,
          timestamp: conv.created_at,
          link: '/conversations'
        });
      });

      // Add leads
      (leadsRes.data || []).forEach(lead => {
        items.push({
          id: `lead-${lead.id}`,
          type: 'lead',
          title: lead.name || 'New lead',
          description: lead.email || 'No email',
          timestamp: lead.created_at,
          link: '/leads'
        });
      });

      // Add agents
      (agentsRes.data || []).forEach(agent => {
        items.push({
          id: `agent-${agent.id}`,
          type: 'agent',
          title: agent.name,
          description: `Status: ${agent.status}`,
          timestamp: agent.created_at,
          link: `/agents/${agent.id}`
        });
      });

      // Sort by timestamp and take top 5
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(items.slice(0, 5));
    } catch (error) {
      logger.error('Error fetching activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'conversation':
        return MessageChatSquare;
      case 'lead':
        return UserPlus;
      case 'agent':
        return Bot;
    }
  };

  const getIconColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'conversation':
        return 'text-info';
      case 'lead':
        return 'text-success';
      case 'agent':
        return 'text-primary';
    }
  };

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-2 bg-muted rounded w-1/3" />
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent activity
          </p>
        ) : (
          <AnimatedList className="space-y-3" staggerDelay={0.05}>
            {activities.map((activity) => {
              const Icon = getIcon(activity.type);
              return (
                <AnimatedItem key={activity.id}>
                  <button
                    onClick={() => activity.link && navigate(activity.link)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-muted/50 ${getIconColor(activity.type)}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                </AnimatedItem>
              );
            })}
          </AnimatedList>
        )}
      </CardContent>
    </Card>
  );
};
