import React from 'react';
import { TabNavigation } from './TabNavigation';
import { DataTable } from './DataTable';

const tabs = [
  { id: 'all-sessions', label: 'All sessions' },
  { id: 'direct-traffic', label: 'Direct traffic' },
  { id: 'organic-traffic', label: 'Organic traffic' },
  { id: 'paid-traffic', label: 'Paid traffic' },
  { id: 'mobile-users', label: 'Mobile users' },
  { id: 'returning-users', label: 'Returning users' }
];

export const MainContent: React.FC = () => {
  return (
    <main className="flex-1 bg-muted/20 pt-8 pb-12 max-md:max-w-full">
      <header className="w-full font-semibold max-md:max-w-full">
        <div className="items-stretch flex w-full flex-col gap-5 px-8 py-0 max-md:max-w-full max-md:px-5">
          <div className="w-full gap-5 max-md:max-w-full">
            <div className="content-start flex-wrap flex w-full gap-[20px_16px] max-md:max-w-full">
              <div className="min-w-80 text-2xl text-foreground leading-none flex-1 shrink basis-[0%] gap-1 max-md:max-w-full">
                <h1 className="text-foreground text-2xl leading-8 max-md:max-w-full">
                  Site traffic
                </h1>
              </div>
              <div className="items-center flex min-w-60 gap-3 text-sm leading-none">
                <button className="justify-center items-center border shadow-sm flex gap-1 overflow-hidden bg-background hover:bg-accent px-3.5 py-2.5 rounded-lg border-border">
                  <div className="justify-center items-center self-stretch flex my-auto px-0.5 py-0">
                    <div className="text-foreground text-sm leading-5 self-stretch my-auto">
                      Export report
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
          <TabNavigation
            tabs={tabs}
            defaultActiveTab="all-sessions"
            onTabChange={(tabId) => console.log('Tab changed:', tabId)}
          />
        </div>
      </header>

      <section className="w-full mt-8 max-md:max-w-full">
        <div className="w-full px-8 py-0 max-md:max-w-full max-md:px-5">
          <DataTable />
        </div>
      </section>
    </main>
  );
};
