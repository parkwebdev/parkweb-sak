import React from 'react';
import { TabNavigation } from './TabNavigation';
import { MetricCard } from './MetricCard';
import { DataTable } from './DataTable';

const tabs = [
  { id: 'all-sessions', label: 'All sessions' },
  { id: 'direct-traffic', label: 'Direct traffic' },
  { id: 'organic-traffic', label: 'Organic traffic' },
  { id: 'paid-traffic', label: 'Paid traffic' },
  { id: 'mobile-users', label: 'Mobile users' },
  { id: 'returning-users', label: 'Returning users' }
];

const metrics = [
  {
    title: 'Total sessions',
    value: '526',
    change: '2.4%',
    changeType: 'positive' as const,
    chartImage: 'https://api.builder.io/api/v1/image/assets/TEMP/c60b814d53b3da23a84551d0916557a5aab7db9d?placeholderIfAbsent=true'
  },
  {
    title: 'Session duration',
    value: '2:24',
    change: '8.6%',
    changeType: 'positive' as const,
    chartImage: 'https://api.builder.io/api/v1/image/assets/TEMP/e1ef2d28c776d76ffc417e9efb3076b447fce9f1?placeholderIfAbsent=true'
  },
  {
    title: 'Pages per session',
    value: '316',
    change: '6.0%',
    changeType: 'positive' as const,
    chartImage: 'https://api.builder.io/api/v1/image/assets/TEMP/67c15d3587e645fdd3680bd143aae6e11a1674be?placeholderIfAbsent=true'
  }
];

export const MainContent: React.FC = () => {
  return (
    <main className="min-w-60 flex-1 shrink basis-[0%] bg-white pt-8 pb-12 rounded-[40px_0_0_0] max-md:max-w-full">
      <header className="w-full font-semibold max-md:max-w-full">
        <div className="items-stretch flex w-full flex-col gap-5 px-8 py-0 max-md:max-w-full max-md:px-5">
          <div className="w-full gap-5 max-md:max-w-full">
            <div className="content-start flex-wrap flex w-full gap-[20px_16px] max-md:max-w-full">
              <div className="min-w-80 text-2xl text-[#181D27] leading-none flex-1 shrink basis-[0%] gap-1 max-md:max-w-full">
                <h1 className="text-[#181D27] text-2xl leading-8 max-md:max-w-full">
                  Site traffic
                </h1>
              </div>
              <div className="items-center flex min-w-60 gap-3 text-sm text-[#414651] leading-none">
                <button className="justify-center items-center border shadow-[0_0_0_1px_rgba(10,13,18,0.18)_inset,0_-2px_0_0_rgba(10,13,18,0.05)_inset,0_1px_2px_0_rgba(10,13,18,0.05)] flex gap-1 overflow-hidden bg-white px-3.5 py-2.5 rounded-lg border-solid border-[#D5D7DA] hover:bg-gray-50">
                  <img
                    src="https://api.builder.io/api/v1/image/assets/TEMP/f74ebaa5f5feb1bd7a2cf317b9e56e2a7ccd1597?placeholderIfAbsent=true"
                    className="aspect-[1] object-contain w-5 self-stretch shrink-0 my-auto"
                    alt="Switch"
                  />
                  <div className="justify-center items-center self-stretch flex my-auto px-0.5 py-0">
                    <div className="text-[#414651] text-sm leading-5 self-stretch my-auto">
                      Switch dashboard
                    </div>
                  </div>
                </button>
                <button className="justify-center items-center border shadow-[0_0_0_1px_rgba(10,13,18,0.18)_inset,0_-2px_0_0_rgba(10,13,18,0.05)_inset,0_1px_2px_0_rgba(10,13,18,0.05)] flex gap-1 overflow-hidden bg-white px-3.5 py-2.5 rounded-lg border-solid border-[#D5D7DA] hover:bg-gray-50">
                  <div className="justify-center items-center self-stretch flex my-auto px-0.5 py-0">
                    <div className="text-[#414651] text-sm leading-5 self-stretch my-auto">
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
          <div className="flex w-full gap-6 flex-wrap max-md:max-w-full">
            {metrics.map((metric, index) => (
              <MetricCard
                key={index}
                title={metric.title}
                value={metric.value}
                change={metric.change}
                changeType={metric.changeType}
                chartImage={metric.chartImage}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="w-full mt-8 max-md:max-w-full">
        <div className="w-full px-8 py-0 max-md:max-w-full max-md:px-5">
          <DataTable />
        </div>
      </section>
    </main>
  );
};
