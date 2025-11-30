import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users01 as Users, MessageChatSquare, UserPlus01 as UserPlus, TrendUp01 as TrendUp, Cube01 as Bot, Zap, Menu01 as Menu } from '@untitledui/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PlanLimitsCard } from '@/components/settings/PlanLimitsCard';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';

interface DashboardProps {
  onMenuClick?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onMenuClick }) => {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    totalAgents: 0,
    activeConversations: 0,
    totalLeads: 0,
    newLeads: 0,
    totalConversations: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !authLoading) {
      fetchStats();
    }
  }, [user, authLoading]);

  const fetchStats = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [agentsRes, conversationsRes, leadsRes] = await Promise.all([
        supabase
          .from('agents')
          .select('id, status')
          .eq('user_id', user.id),
        supabase
          .from('conversations')
          .select('id, status, created_at')
          .eq('user_id', user.id),
        supabase
          .from('leads')
          .select('id, status, created_at')
          .eq('user_id', user.id)
      ]);

      const agents = agentsRes.data || [];
      const conversations = conversationsRes.data || [];
      const leads = leadsRes.data || [];

      // Calculate stats
      const activeAgents = agents.filter(a => a.status === 'active').length;
      const activeConvs = conversations.filter(c => c.status === 'active').length;
      const totalConvs = conversations.length;

      // New leads in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const newLeads = leads.filter(l => new Date(l.created_at) >= sevenDaysAgo).length;

      // Conversion rate: converted leads / total leads
      const convertedLeads = leads.filter(l => l.status === 'converted').length;
      const conversionRate = leads.length > 0 ? Math.round((convertedLeads / leads.length) * 100) : 0;

      setStats({
        totalAgents: activeAgents,
        activeConversations: activeConvs,
        totalLeads: leads.length,
        newLeads,
        totalConversations: totalConvs,
        conversionRate
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="text-center max-w-md">
          <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-base font-bold mb-2">Not Authenticated</h2>
          <p className="text-sm text-muted-foreground">
            Please sign in to access the dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 bg-muted/30 min-h-screen pt-4 lg:pt-8">
      <header className="w-full font-medium">
        <div className="items-stretch flex w-full flex-col gap-6 px-4 lg:px-8 py-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden flex items-center gap-2"
                onClick={onMenuClick}
              >
                <Menu size={16} />
              </Button>
              <div className="flex-1 sm:flex-none">
                <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 lg:px-8 mt-6">

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <AnimatedList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.08}>
            {/* Active Agents */}
            <AnimatedItem>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Agents
                  </CardTitle>
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{stats.totalAgents}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    AI agents ready to assist
                  </p>
                </CardContent>
              </Card>
            </AnimatedItem>

            {/* Active Conversations */}
            <AnimatedItem>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Conversations
                  </CardTitle>
                  <MessageChatSquare size={16} className="text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{stats.activeConversations}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Out of {stats.totalConversations} total
                  </p>
                </CardContent>
              </Card>
            </AnimatedItem>

            {/* Total Leads */}
            <AnimatedItem>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Leads
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{stats.totalLeads}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Leads captured
                  </p>
                </CardContent>
              </Card>
            </AnimatedItem>

            {/* New Leads (Last 7 Days) */}
            <AnimatedItem>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    New Leads (7d)
                  </CardTitle>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{stats.newLeads}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Recent leads
                  </p>
                </CardContent>
              </Card>
            </AnimatedItem>

            {/* Conversion Rate */}
            <AnimatedItem>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Conversion Rate
                  </CardTitle>
                  <TrendUp size={16} className="text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{stats.conversionRate}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Lead to conversion
                  </p>
                </CardContent>
              </Card>
            </AnimatedItem>

            {/* Quick Action */}
            <AnimatedItem>
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-primary">
                    Quick Start
                  </CardTitle>
                  <Zap className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Create your first agent to start capturing leads
                  </p>
                </CardContent>
              </Card>
            </AnimatedItem>
          </AnimatedList>
        )}

        {/* Plan Limits */}
        {!loading && (
          <div className="mt-6">
            <PlanLimitsCard />
          </div>
        )}
      </div>
    </main>
  );
};
