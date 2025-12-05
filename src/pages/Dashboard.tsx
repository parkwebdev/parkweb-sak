import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users01 as Users, MessageChatSquare, UserPlus01 as UserPlus, TrendUp01 as TrendUp, Cube01 as Bot, Zap } from '@untitledui/icons';
import { Spinner } from '@/components/ui/spinner';

import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';

export const Dashboard: React.FC = () => {
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
        <Spinner size="xl" />
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
    <main className="flex-1 bg-muted/30 h-screen overflow-auto">
      <div className="px-4 lg:px-8 pt-4 lg:pt-8 space-y-6">
      {/* Stats Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <AnimatedList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.08}>
          <AnimatedItem>
            <Card className="border-border/50 hover:border-border transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Agents</CardTitle>
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-muted/50">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalAgents}</div>
                <p className="text-xs text-muted-foreground mt-1">Ready to respond</p>
              </CardContent>
            </Card>
          </AnimatedItem>

          <AnimatedItem>
            <Card className="border-border/50 hover:border-border transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Conversations</CardTitle>
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-muted/50">
                  <MessageChatSquare className="w-5 h-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeConversations}</div>
                <p className="text-xs text-muted-foreground mt-1">Currently ongoing</p>
              </CardContent>
            </Card>
          </AnimatedItem>

          <AnimatedItem>
            <Card className="border-border/50 hover:border-border transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-muted/50">
                  <Users className="w-5 h-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalLeads}</div>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </CardContent>
            </Card>
          </AnimatedItem>

          <AnimatedItem>
            <Card className="border-border/50 hover:border-border transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">New Leads (7d)</CardTitle>
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-muted/50">
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.newLeads}</div>
                <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
              </CardContent>
            </Card>
          </AnimatedItem>

          <AnimatedItem>
            <Card className="border-border/50 hover:border-border transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Conversations</CardTitle>
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-muted/50">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalConversations}</div>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </CardContent>
            </Card>
          </AnimatedItem>

          <AnimatedItem>
            <Card className="border-border/50 hover:border-border transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-muted/50">
                  <TrendUp className="w-5 h-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.conversionRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">Lead to customer</p>
              </CardContent>
            </Card>
          </AnimatedItem>
        </AnimatedList>
      )}
      </div>
    </main>
  );
};
