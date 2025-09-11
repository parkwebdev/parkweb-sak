import React, { useState, useEffect } from 'react';
import { Menu01 as Menu, Link01 as Link2, Copy01 as Copy, User01 as User, File02 as FileText, Clock, Eye, ClockCheck, AlertTriangle } from '@untitledui/icons';
import { TabNavigation } from './TabNavigation';
import { DataTable } from './DataTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/Badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

const tabs = [
  { id: 'links-invitations', label: 'View All' },
  { id: 'completed', label: 'Complete' },
  { id: 'submissions-sows', label: 'Incomplete' }, 
  { id: 'all-clients', label: 'In Review' }
];

interface MainContentProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onMenuClick?: () => void;
  pageTitle?: string;
  pageDescription?: string;
  showStats?: boolean; // Add optional prop to control stats display
}

export const MainContent: React.FC<MainContentProps> = ({ 
  activeTab = 'links-invitations', 
  onTabChange,
  onMenuClick,
  pageTitle = "Onboarding",
  pageDescription = "Manage client onboarding links, submissions, and scope of work documents",
  showStats = false // Default to false for onboarding page
}) => {
  const { user } = useAuth();
  const [userDisplayName, setUserDisplayName] = useState<string>('');
  const [stats, setStats] = useState({
    totalClients: 0,
    linksCreated: 0,
    submissionsReceived: 0,
    sowsGenerated: 0,
    projectsCompleted: 0,
    conversionRate: 0
  });

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .single();

      if (error) {
        logger.error('Error fetching user profile:', error);
        // Fallback to user email or default
        const fallbackName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
        setUserDisplayName(fallbackName);
      } else {
        const displayName = data?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
        setUserDisplayName(displayName);
      }
    } catch (error) {
      logger.error('Error in fetchUserProfile:', error);
      const fallbackName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
      setUserDisplayName(fallbackName);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch all client onboarding links and submissions
      const [linksResult, submissionsResult, sowsResult] = await Promise.all([
        supabase.from('client_onboarding_links').select('status, email'),
        supabase.from('onboarding_submissions').select('id, client_email'),
        supabase.from('scope_of_works').select('status, email')
      ]);

      const linksData = linksResult.data || [];
      const submissionsData = submissionsResult.data || [];
      const sowsData = sowsResult.data || [];

      // Calculate unified stats
      const linksCreated = linksData.length;
      const submissionsReceived = submissionsData.length;
      const sowsGenerated = sowsData.length;
      const projectsCompleted = linksData.filter(item => item.status === 'Approved').length;
      
      // Calculate unique clients across all systems
      const uniqueEmails = new Set([
        ...linksData.map(item => item.email),
        ...submissionsData.map(item => item.client_email),
        ...sowsData.map(item => item.email)
      ]);
      const totalClients = uniqueEmails.size;
      
      // Calculate conversion rate (completed projects / total links created)
      const conversionRate = linksCreated > 0 ? Math.round((projectsCompleted / linksCreated) * 100) : 0;

      setStats({
        totalClients,
        linksCreated,
        submissionsReceived,
        sowsGenerated,
        projectsCompleted,
        conversionRate
      });
    } catch (error) {
      logger.error('Error fetching stats:', error);
    }
  };

  return (
    <main className="flex-1 bg-muted/30 min-h-screen pt-4 lg:pt-8 pb-12">
      <header className="w-full font-medium">
        <div className="items-stretch flex w-full flex-col gap-4 px-4 lg:px-8 py-0">
          <div className="w-full gap-4">
            <div className="content-start flex-wrap flex w-full gap-4 lg:gap-[16px_12px]">
              <div className="flex items-center gap-3 lg:hidden w-full mb-2">
                <button
                  onClick={onMenuClick}
                  className="p-2 rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                >
                  <Menu size={20} />
                </button>
                <h1 className="text-foreground text-xl font-semibold leading-tight">
                  {pageTitle}
                </h1>
              </div>
              
              <div className="min-w-0 lg:min-w-64 text-xl text-foreground leading-none flex-1 shrink basis-[0%] gap-1">
                <h1 className="hidden lg:block text-foreground text-2xl font-semibold leading-tight mb-1">
                  {pageTitle}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {pageDescription}
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Overview - Only show if showStats is true */}
          {showStats && (
            <div className="w-full">
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
                <Card className="compact-card">
                  <CardContent className="compact-content">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Total Clients</p>
                        <p className="text-lg lg:text-xl font-semibold">{stats.totalClients}</p>
                      </div>
                      <User className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="compact-card">
                  <CardContent className="compact-content">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Links Created</p>
                        <p className="text-lg lg:text-xl font-semibold">{stats.linksCreated}</p>
                      </div>
                      <Link2 className="h-4 w-4 lg:h-5 lg:w-5 text-info" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="compact-card">
                  <CardContent className="compact-content">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Submissions</p>
                        <p className="text-lg lg:text-xl font-semibold">{stats.submissionsReceived}</p>
                      </div>
                      <Clock className="h-4 w-4 lg:h-5 lg:w-5 text-warning" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="compact-card">
                  <CardContent className="compact-content">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">SOWs Generated</p>
                        <p className="text-lg lg:text-xl font-semibold">{stats.sowsGenerated}</p>
                      </div>
                      <FileText className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="compact-card">
                  <CardContent className="compact-content">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Completed</p>
                        <p className="text-lg lg:text-xl font-semibold">{stats.projectsCompleted}</p>
                      </div>
                      <ClockCheck className="h-4 w-4 lg:h-5 lg:w-5 text-success" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="compact-card">
                  <CardContent className="compact-content">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Conversion</p>
                        <p className="text-lg lg:text-xl font-semibold">{stats.conversionRate}%</p>
                      </div>
                      <AlertTriangle className="h-4 w-4 lg:h-5 lg:w-5 text-accent" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          <TabNavigation
            tabs={tabs}
            defaultActiveTab={activeTab}
            onTabChange={onTabChange}
          />
        </div>
      </header>

      <section className="w-full mt-6">
        <div className="w-full px-4 lg:px-8 py-0">
          <DataTable activeTab={activeTab} />
        </div>
      </section>
    </main>
  );
};
