import React, { useState, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users01 as Users, MessageChatSquare, UserPlus01 as UserPlus, TrendUp01 as TrendUp, Cube01 as Bot, Zap, Menu01 as Menu } from '@untitledui/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PlanLimitsCard } from '@/components/settings/PlanLimitsCard';

export const Dashboard: React.FC = () => {
  const { currentOrg, loading: orgLoading } = useOrganization();
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
    if (currentOrg && !orgLoading) {
      fetchStats();
    }
  }, [currentOrg, orgLoading]);

  const fetchStats = async () => {
    if (!currentOrg) return;

    setLoading(true);
    try {
      const [agentsRes, conversationsRes, leadsRes] = await Promise.all([
        supabase
          .from('agents')
          .select('id, status')
          .eq('org_id', currentOrg.id),
        supabase
          .from('conversations')
          .select('id, status, created_at')
          .eq('org_id', currentOrg.id),
        supabase
          .from('leads')
          .select('id, status, created_at')
          .eq('org_id', currentOrg.id)
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

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="text-center max-w-md">
          <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-base font-bold mb-2">No Organization</h2>
          <p className="text-sm text-muted-foreground">
            You don't belong to any organization yet. Contact your administrator to get access.
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
            <div>
              <h1 className="text-sm font-semibold text-foreground">Dashboard</h1>
              <p className="text-xs text-muted-foreground mt-1">{currentOrg.name}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Active Agents */}
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

            {/* Active Conversations */}
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

            {/* Total Leads */}
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

            {/* New Leads (Last 7 Days) */}
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

            {/* Conversion Rate */}
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

            {/* Quick Action */}
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
          </div>
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
