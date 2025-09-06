import React from 'react';
import { Menu01 as Menu, Link01 as Link2, Copy01 as Copy, User01 as User, File02 as FileText, Clock, Eye, ClockCheck, AlertTriangle } from '@untitledui/icons';
import { TabNavigation } from './TabNavigation';
import { DataTable } from './DataTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/Badge';

const tabs = [
  { id: 'onboarding', label: 'Onboarding' },
  { id: 'scope-of-work', label: 'Scope Of Work' },
  { id: 'completed', label: 'Completed' }
];

interface MainContentProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onMenuClick?: () => void;
}

export const MainContent: React.FC<MainContentProps> = ({ 
  activeTab = 'onboarding', 
  onTabChange,
  onMenuClick
}) => {
  // Mock data for stats
  const onboardingStats = {
    total: 12,
    inProgress: 5,
    completed: 4,
    sowGenerated: 3
  };

  const scopeOfWorksStats = {
    total: 8,
    draft: 3,
    inReview: 2,
    approved: 3
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
                  Dashboard
                </h1>
              </div>
              
              <div className="min-w-0 lg:min-w-64 text-xl text-foreground leading-none flex-1 shrink basis-[0%] gap-1">
                <h1 className="hidden lg:block text-foreground text-2xl font-semibold leading-tight mb-1">
                  Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  Overview of client onboarding and project metrics
                </p>
              </div>
              <div className="items-center flex min-w-0 lg:min-w-48 gap-2.5 text-xs leading-none">
                <button className="justify-center items-center border shadow-sm flex gap-1 overflow-hidden bg-card hover:bg-accent px-3 py-2 rounded-md border-border">
                  <div className="justify-center items-center self-stretch flex my-auto px-0.5 py-0">
                    <div className="text-foreground text-xs leading-4 self-stretch my-auto">
                      Export report
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Onboarding Stats */}
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Total Links
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{onboardingStats.total}</div>
                  <p className="text-xs text-blue-700 dark:text-blue-200">Client onboarding links</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/30 border-orange-200 dark:border-orange-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    In Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{onboardingStats.inProgress}</div>
                  <p className="text-xs text-orange-700 dark:text-orange-200">Active onboardings</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/30 border-green-200 dark:border-green-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100 flex items-center gap-2">
                    <ClockCheck className="h-4 w-4" />
                    Completed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">{onboardingStats.completed}</div>
                  <p className="text-xs text-green-700 dark:text-green-200">Finished onboardings</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/30 border-purple-200 dark:border-purple-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    SOW Generated
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{onboardingStats.sowGenerated}</div>
                  <p className="text-xs text-purple-700 dark:text-purple-200">Scopes created</p>
                </CardContent>
              </Card>
            </div>

            {/* Scope of Works Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950/50 dark:to-slate-900/30 border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Total Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{scopeOfWorksStats.total}</div>
                  <p className="text-xs text-slate-700 dark:text-slate-200">All scope of works</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/50 dark:to-yellow-900/30 border-yellow-200 dark:border-yellow-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-yellow-900 dark:text-yellow-100 flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    Draft
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{scopeOfWorksStats.draft}</div>
                  <p className="text-xs text-yellow-700 dark:text-yellow-200">Work in progress</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    In Review
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{scopeOfWorksStats.inReview}</div>
                  <p className="text-xs text-blue-700 dark:text-blue-200">Under review</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/30 border-green-200 dark:border-green-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100 flex items-center gap-2">
                    <ClockCheck className="h-4 w-4" />
                    Approved
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">{scopeOfWorksStats.approved}</div>
                  <p className="text-xs text-green-700 dark:text-green-200">Ready to go</p>
                </CardContent>
              </Card>
            </div>
          </div>

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
