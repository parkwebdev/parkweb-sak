/**
 * Analytics Page
 * 
 * Comprehensive analytics dashboard with section navigation.
 * Uses consolidated data hook for all analytics data.
 * 
 * @page
 */

import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AnalyticsSectionMenu, AnalyticsSection } from '@/components/analytics/AnalyticsSectionMenu';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { AnalyticsDatePicker } from '@/components/analytics/AnalyticsDatePicker';
import { SECTION_INFO, TOOLBAR_SECTIONS } from '@/lib/analytics-constants';
import { AnalyticsDatePreset, getDateRangeFromPreset } from '@/components/analytics/constants';

import {
  ConversationsSection,
  LeadsSection,
  BookingsSection,
  AIPerformanceSection,
  SourcesSection,
  PagesSection,
  GeographySection,
  ReportsSection,
} from '@/components/analytics/sections';


function Analytics() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // === UI State ===
  const [activeTab, setActiveTab] = useState<AnalyticsSection>(() => {
    const tabParam = searchParams.get('tab');
    const validTabs: AnalyticsSection[] = ['conversations', 'leads', 'bookings', 'ai-performance', 'sources', 'pages', 'geography', 'reports'];
    if (tabParam && validTabs.includes(tabParam as AnalyticsSection)) {
      return tabParam as AnalyticsSection;
    }
    return 'conversations';
  });

  // Clear tab param from URL after reading (clean URL)
  useEffect(() => {
    if (searchParams.has('tab')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('tab');
      setSearchParams(newParams, { replace: true });
    }
  }, []);

  // === Date State (Simplified) ===
  const [datePreset, setDatePreset] = useState<AnalyticsDatePreset>('last30');
  const [filters] = useState({ leadStatus: 'all', conversationStatus: 'all' });

  // Compute date range from preset
  const { start: startDate, end: endDate } = useMemo(
    () => getDateRangeFromPreset(datePreset),
    [datePreset]
  );

  // === Analytics Data ===
  const data = useAnalyticsData({
    startDate,
    endDate,
    comparisonStartDate: startDate,
    comparisonEndDate: endDate,
    comparisonMode: false,
    filters,
  });

  // === Derived State ===
  const showToolbar = TOOLBAR_SECTIONS.includes(activeTab);
  const showBuildReport = activeTab === 'reports';

  return (
    <div className="flex-1 h-full bg-muted/30 flex min-h-0">
      <AnalyticsSectionMenu activeSection={activeTab} onSectionChange={setActiveTab} />
      
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
        <div className="px-4 lg:px-8 pt-4 lg:pt-8 pb-8 space-y-6">
          {/* Header with inline controls */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{SECTION_INFO[activeTab].title}</h1>
              <p className="text-sm text-muted-foreground mt-1">{SECTION_INFO[activeTab].description}</p>
            </div>
            
            <div className="flex items-center gap-3">
              {showToolbar && (
                <>
                  <AnalyticsDatePicker
                    selectedPreset={datePreset}
                    onPresetChange={setDatePreset}
                  />
                  <div className="flex items-center gap-2">
                    <Label htmlFor="mock-toggle" className="text-sm text-muted-foreground cursor-pointer">
                      {data.mockMode ? 'Mock Data' : 'Live Data'}
                    </Label>
                    <Switch
                      id="mock-toggle"
                      checked={data.mockMode}
                      onCheckedChange={data.setMockMode}
                      aria-label="Toggle mock data mode"
                    />
                  </div>
                </>
              )}
              {showBuildReport && (
                <Button size="sm" onClick={() => navigate('/report-builder')}>Build Report</Button>
              )}
            </div>
          </div>

          {/* Sections */}
          {activeTab === 'conversations' && (
            <ConversationsSection
              conversationStats={data.conversationStats}
              funnelStages={data.funnelStages}
              conversationTrendValue={data.conversationTrendValue}
              loading={data.loading}
              funnelLoading={data.funnelLoading}
            />
          )}

          {activeTab === 'leads' && (
            <LeadsSection
              totalLeads={data.totalLeads}
              conversionRate={data.conversionRate}
              leadChartData={data.leadChartData}
              conversionChartData={data.conversionChartData}
              leadStats={data.leadStats}
              leadChange={data.calculatePeriodChange(data.leadTrend)}
              conversionChange={data.calculatePointChange(data.conversionTrend)}
              leadTrendValue={data.leadTrendValue}
              loading={data.loading}
            />
          )}

          {activeTab === 'bookings' && (
            <BookingsSection
              totalBookings={data.totalBookings}
              bookingChartData={data.bookingChartData}
              bookingChange={data.calculatePeriodChange(data.bookingTrend)}
              bookingsByLocation={data.bookingStats?.byLocation ?? []}
              bookingTrendData={data.bookingStats?.trend ?? []}
              bookingTrendValue={data.bookingTrendValue}
              loading={data.bookingLoading}
            />
          )}

          {activeTab === 'ai-performance' && (
            <AIPerformanceSection
              containmentRate={data.aiPerformanceStats?.containmentRate ?? 0}
              resolutionRate={data.aiPerformanceStats?.resolutionRate ?? 0}
              totalConversations={data.aiPerformanceStats?.totalConversations ?? 0}
              humanTakeover={data.aiPerformanceStats?.humanTakeover ?? 0}
              csatDistribution={data.satisfactionStats?.distribution ?? []}
              averageRating={data.satisfactionStats?.averageRating ?? 0}
              totalRatings={data.satisfactionStats?.totalRatings ?? 0}
              recentFeedback={data.satisfactionStats?.recentFeedback ?? []}
              aiContainmentTrendValue={data.aiContainmentTrendValue ?? 0}
              aiPerformanceLoading={data.aiPerformanceLoading ?? false}
              satisfactionLoading={data.satisfactionLoading}
            />
          )}

          {activeTab === 'sources' && (
            <SourcesSection
              trafficSources={data.trafficSources}
              sourcesByDate={data.sourcesByDate}
              leadsBySource={data.leadsBySource}
              engagement={data.engagement}
              comparisonMode={false}
              trafficLoading={data.trafficLoading}
              comparisonTrafficLoading={false}
            />
          )}

          {activeTab === 'pages' && (
            <PagesSection
              engagement={data.engagement}
              landingPages={data.landingPages}
              pageDepthDistribution={data.pageDepthDistribution}
              trafficLoading={data.trafficLoading}
            />
          )}

          {activeTab === 'geography' && (
            <GeographySection
              locationData={data.locationData}
              trafficLoading={data.trafficLoading}
            />
          )}

          {activeTab === 'reports' && <ReportsSection />}
        </div>
      </main>
    </div>
  );
}

export default Analytics;
