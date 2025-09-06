import React from 'react';
import { TabNavigation } from './TabNavigation';
import { DataTable } from './DataTable';

const tabs = [
  { id: 'onboarding', label: 'Onboarding' },
  { id: 'scope-of-work', label: 'Scope Of Work' },
  { id: 'completed', label: 'Completed' }
];

interface MainContentProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export const MainContent: React.FC<MainContentProps> = ({ 
  activeTab = 'onboarding', 
  onTabChange 
}) => {
  return (
    <main className="flex-1 bg-muted/20 pt-6 pb-8">
      <header className="w-full font-medium">
        <div className="items-stretch flex w-full flex-col gap-4 px-6 py-0 max-md:px-4">
          <div className="w-full gap-4">
            <div className="content-start flex-wrap flex w-full gap-[16px_12px]">
              <div className="min-w-64 text-xl text-foreground leading-none flex-1 shrink basis-[0%] gap-1">
                <h1 className="text-foreground text-2xl font-semibold leading-tight mb-1">
                  Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  Overview of client onboarding and project metrics
                </p>
              </div>
              <div className="items-center flex min-w-48 gap-2.5 text-xs leading-none">
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

          <TabNavigation
            tabs={tabs}
            defaultActiveTab={activeTab}
            onTabChange={onTabChange}
          />
        </div>
      </header>

      <section className="w-full mt-6">
        <div className="w-full px-6 py-0 max-md:px-4">
          <DataTable activeTab={activeTab} />
        </div>
      </section>
    </main>
  );
};
