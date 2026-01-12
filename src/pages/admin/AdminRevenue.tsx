/**
 * Admin Revenue Page
 * 
 * Revenue analytics and metrics dashboard with sidebar navigation.
 * 
 * @module pages/admin/AdminRevenue
 */

import { useMemo, useState } from 'react';
import { TrendUp01 } from '@untitledui/icons';
import { RevenueSectionMenu } from '@/components/admin/revenue/RevenueSectionMenu';
import {
  OverviewSection,
  MRRBreakdownSection,
  SubscriptionsSection,
  ChurnSection,
  AccountsSection,
} from '@/components/admin/revenue/sections';
import { useRevenueAnalytics } from '@/hooks/admin';
import { useTopBar, TopBarPageContext } from '@/components/layout/TopBar';
import { type RevenueSection, REVENUE_SECTION_INFO } from '@/lib/admin/revenue-constants';

/**
 * Revenue analytics page for Super Admin.
 */
export function AdminRevenue() {
  const [activeSection, setActiveSection] = useState<RevenueSection>('overview');
  const { data, loading } = useRevenueAnalytics();

  // Configure top bar for this page
  const topBarConfig = useMemo(() => ({
    left: <TopBarPageContext icon={TrendUp01} title="Revenue Analytics" />,
  }), []);
  useTopBar(topBarConfig);

  return (
    <div className="flex-1 h-full bg-muted/30 flex min-h-0">
      <RevenueSectionMenu 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="px-4 lg:px-8 pt-4 lg:pt-8 pb-8 space-y-6">
          {/* Section header */}
          <div>
            <h1 className="text-base font-semibold text-foreground">
              {REVENUE_SECTION_INFO[activeSection].title}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {REVENUE_SECTION_INFO[activeSection].description}
            </p>
          </div>

          {/* Render active section */}
          {activeSection === 'overview' && <OverviewSection data={data} loading={loading} />}
          {activeSection === 'mrr-breakdown' && <MRRBreakdownSection data={data} loading={loading} />}
          {activeSection === 'subscriptions' && <SubscriptionsSection data={data} loading={loading} />}
          {activeSection === 'churn' && <ChurnSection data={data} loading={loading} />}
          {activeSection === 'accounts' && <AccountsSection data={data} loading={loading} />}
        </div>
      </main>
    </div>
  );
}
