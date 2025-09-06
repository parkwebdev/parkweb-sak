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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="compact-card">
              <CardContent className="compact-content">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total Links</p>
                    <p className="text-lg lg:text-xl font-semibold">12</p>
                  </div>
                  <Link2 className="h-4 w-4 lg:h-5 lg:w-5 text-info" />
                </div>
              </CardContent>
            </Card>
            <Card className="compact-card">
              <CardContent className="compact-content">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">In Progress</p>
                    <p className="text-lg lg:text-xl font-semibold">5</p>
                  </div>
                  <Clock className="h-4 w-4 lg:h-5 lg:w-5 text-warning" />
                </div>
              </CardContent>
            </Card>
            <Card className="compact-card">
              <CardContent className="compact-content">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">SOW Generated</p>
                    <p className="text-lg lg:text-xl font-semibold">3</p>
                  </div>
                  <FileText className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card className="compact-card">
              <CardContent className="compact-content">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Approved</p>
                    <p className="text-lg lg:text-xl font-semibold">4</p>
                  </div>
                  <User className="h-4 w-4 lg:h-5 lg:w-5 text-success" />
                </div>
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
