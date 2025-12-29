# Analytics.tsx Refactoring Plan

> **Status**: PENDING APPROVAL  
> **File**: `src/pages/Analytics.tsx`  
> **Current Size**: 881 lines  
> **Target Size**: ~200-250 lines  
> **Created**: 2025-12-29

---

## Overview

This document outlines the systematic refactoring of `Analytics.tsx` from a monolithic 881-line file into a well-structured, maintainable architecture with proper separation of concerns.

### Goals
1. Improve maintainability through smaller, focused components
2. Enable easier testing of individual sections
3. Reduce cognitive load when making changes
4. Preserve 100% of existing functionality and visuals
5. Follow established project patterns and design system

### Non-Goals
- Adding new features
- Changing any business logic
- Modifying visual appearance
- Altering data fetching patterns

---

## Phase 0: Pre-Refactoring Verification

**Objective**: Document current state before any changes.

### Tasks
- [ ] Screenshot each of the 8 analytics tabs
- [ ] Document all loading states
- [ ] Document all empty states
- [ ] List all component props currently passed
- [ ] Verify all tabs render correctly
- [ ] Note any existing console errors/warnings

### Current Tab Sections (8 total)
| Tab | Line Range | Key Components |
|-----|------------|----------------|
| Conversations | 635-677 | PeakActivityChart, ConversationChart, ConversationFunnelCard |
| Leads | 680-721 | MetricCardWithChart × 2, LeadConversionChart |
| Bookings | 724-766 | MetricCardWithChart, BookingsByLocationChart, BookingTrendChart |
| AI Performance | 769-787 | AIPerformanceCard, CSATDistributionCard, CustomerFeedbackCard |
| Sources | 790-824 | TrafficSourceChart, LeadSourceBreakdownCard, TrafficSourceTrendChart |
| Pages | 827-840 | PageEngagementCard, TopPagesChart, PageDepthChart, LandingPagesTable |
| Geography | 843-856 | VisitorLocationMap |
| Reports | 859-864 | ExportHistoryTable, ScheduledReportsManager |

### Verification Checklist
- [ ] Conversations tab renders with charts
- [ ] Leads tab renders with KPI cards and chart
- [ ] Bookings tab renders with location chart
- [ ] AI Performance tab renders with all cards
- [ ] Sources tab renders with traffic charts
- [ ] Pages tab renders with engagement data
- [ ] Geography tab renders with map
- [ ] Reports tab renders with export history

---

## Phase 1: Extract Utility Functions

**Objective**: Move pure utility functions to dedicated file.  
**Risk Level**: LOW  
**Estimated Lines Removed**: ~60 lines

### Create File
**Path**: `src/lib/analytics-utils.ts`

### Functions to Extract

#### 1. `ensureVisualVariance`
- **Source**: Lines 69-96
- **Purpose**: Adds minimal variance to trend data for visual appeal
- **Signature**:
```typescript
export function ensureVisualVariance(
  trend: number[], 
  minPoints?: number
): number[]
```

#### 2. `generateChartData`
- **Source**: Lines 98-130
- **Purpose**: Transforms daily counts into chart-compatible format
- **Signature**:
```typescript
export function generateChartData(
  dailyCounts: number[]
): { value: number }[]
```

### Verification Steps
1. [ ] Import utilities in Analytics.tsx
2. [ ] Verify sparkline charts render identically
3. [ ] Verify KPI trend arrows display correctly
4. [ ] No TypeScript errors
5. [ ] No console errors

---

## Phase 2: Create Section Components

**Objective**: Extract each tab's JSX into self-contained components.  
**Risk Level**: MEDIUM  
**Estimated Lines Removed**: ~250 lines

### Directory Structure
```
src/components/analytics/sections/
├── index.ts                    # Barrel exports
├── ConversationsSection.tsx    # Conversations tab
├── LeadsSection.tsx            # Leads tab
├── BookingsSection.tsx         # Bookings tab
├── AIPerformanceSection.tsx    # AI Performance tab
├── SourcesSection.tsx          # Sources tab
├── PagesSection.tsx            # Pages tab
├── GeographySection.tsx        # Geography tab
└── ReportsSection.tsx          # Reports tab
```

### Component Specifications

#### 2.1 ConversationsSection.tsx
**Source Lines**: 635-677

**Props Interface**:
```typescript
interface ConversationsSectionProps {
  // Chart data
  peakActivityData: PeakActivityDataPoint[];
  conversationVolumeData: ConversationVolumeDataPoint[];
  funnelData: FunnelStage[];
  
  // Loading states
  loading: boolean;
  
  // Comparison
  comparisonMode: boolean;
}
```

**Components Used**:
- PeakActivityChart
- ConversationChart
- ConversationFunnelCard
- AnimatedList, AnimatedItem

---

#### 2.2 LeadsSection.tsx
**Source Lines**: 680-721

**Props Interface**:
```typescript
interface LeadsSectionProps {
  // KPI data
  totalLeads: number;
  leadTrendValue: number;
  conversionRate: string;
  conversionTrendValue: number;
  
  // Chart data
  leadChartData: { value: number }[];
  conversionChartData: { value: number }[];
  leadConversionData: LeadConversionDataPoint[];
  
  // Loading states
  loading: boolean;
  
  // Comparison
  comparisonMode: boolean;
  comparisonLeadStats?: LeadStats;
}
```

**Components Used**:
- MetricCardWithChart × 2
- LeadConversionChart
- AnimatedList, AnimatedItem

---

#### 2.3 BookingsSection.tsx
**Source Lines**: 724-766

**Props Interface**:
```typescript
interface BookingsSectionProps {
  // KPI data
  confirmedBookings: number;
  bookingTrendValue: number;
  
  // Chart data
  bookingChartData: { value: number }[];
  bookingsByLocation: LocationBookingData[];
  bookingTrendData: BookingTrendData[];
  
  // Loading states
  loading: boolean;
  bookingLoading: boolean;
  
  // Comparison
  comparisonMode: boolean;
  comparisonBookingStats?: BookingStats;
}
```

**Components Used**:
- MetricCardWithChart
- BookingsByLocationChart
- BookingTrendChart
- AnimatedList, AnimatedItem

---

#### 2.4 AIPerformanceSection.tsx
**Source Lines**: 769-787

**Props Interface**:
```typescript
interface AIPerformanceSectionProps {
  // Data
  aiPerformanceStats: AIPerformanceStats;
  satisfactionStats: SatisfactionStats;
  
  // Loading states
  satisfactionLoading: boolean;
  aiPerformanceLoading: boolean;
}
```

**Components Used**:
- AIPerformanceCard
- CSATDistributionCard
- CustomerFeedbackCard
- AnimatedList, AnimatedItem

---

#### 2.5 SourcesSection.tsx
**Source Lines**: 790-824

**Props Interface**:
```typescript
interface SourcesSectionProps {
  // Data
  trafficSourceData: TrafficSourceData[];
  leadSourceData: LeadSourceData[];
  trafficTrendData: TrafficTrendData[];
  
  // Loading states
  trafficLoading: boolean;
}
```

**Components Used**:
- TrafficSourceChart
- LeadSourceBreakdownCard
- TrafficSourceTrendChart
- AnimatedList, AnimatedItem

---

#### 2.6 PagesSection.tsx
**Source Lines**: 827-840

**Props Interface**:
```typescript
interface PagesSectionProps {
  // Data
  pageEngagementData: PageEngagementData;
  topPagesData: TopPageData[];
  pageDepthData: PageDepthData[];
  landingPagesData: LandingPageData[];
  
  // Loading states
  loading: boolean;
}
```

**Components Used**:
- PageEngagementCard
- TopPagesChart
- PageDepthChart
- LandingPagesTable
- AnimatedList, AnimatedItem

---

#### 2.7 GeographySection.tsx
**Source Lines**: 843-856

**Props Interface**:
```typescript
interface GeographySectionProps {
  // Data
  visitorLocationData: VisitorLocationData[];
  
  // Loading states
  loading: boolean;
}
```

**Components Used**:
- VisitorLocationMap
- AnimatedList, AnimatedItem

---

#### 2.8 ReportsSection.tsx
**Source Lines**: 859-864

**Props Interface**:
```typescript
interface ReportsSectionProps {
  // Data
  reportExports: ReportExport[];
  scheduledReports: ScheduledReport[];
  
  // Loading states
  exportsLoading: boolean;
  scheduledLoading: boolean;
  
  // Actions
  onDeleteExport: (id: string) => void;
  onUpdateScheduledReport: (report: ScheduledReport) => void;
  onDeleteScheduledReport: (id: string) => void;
}
```

**Components Used**:
- ExportHistoryTable
- ScheduledReportsManager
- AnimatedList, AnimatedItem

---

#### 2.9 index.ts (Barrel Export)
```typescript
export { ConversationsSection } from './ConversationsSection';
export { LeadsSection } from './LeadsSection';
export { BookingsSection } from './BookingsSection';
export { AIPerformanceSection } from './AIPerformanceSection';
export { SourcesSection } from './SourcesSection';
export { PagesSection } from './PagesSection';
export { GeographySection } from './GeographySection';
export { ReportsSection } from './ReportsSection';
```

### Verification Steps (Per Section)
1. [ ] Navigate to the tab
2. [ ] Confirm visual parity with original
3. [ ] Test loading state (refresh page)
4. [ ] Test empty state if applicable
5. [ ] Verify animations work
6. [ ] No TypeScript errors
7. [ ] No console errors

---

## Phase 3: Create useAnalyticsData Hook

**Objective**: Consolidate all data fetching and calculations into one hook.  
**Risk Level**: MEDIUM  
**Estimated Lines Removed**: ~200 lines

### Create File
**Path**: `src/hooks/useAnalyticsData.ts`

### Hook Consolidates

#### Data Hooks (6 total)
1. `useAnalytics` - Conversation stats, lead stats, agent performance
2. `useBookingAnalytics` - Booking data by location and trends
3. `useSatisfactionAnalytics` - CSAT scores, ratings, feedback
4. `useAIPerformanceAnalytics` - AI containment, resolution rates
5. `useTrafficAnalytics` - Traffic sources, page engagement
6. `useReportExports` - Export history, scheduled reports

#### Mock Mode Logic
- Consolidates 14 ternary assignments for mock/real data switching
- Single `useMockMode` check

#### Calculations
- `calculatePeriodChange` - Trend percentage between periods
- `calculatePointChange` - Trend percentage between data points
- KPI calculations (totalConversations, totalLeads, conversionRate, etc.)
- `analyticsData` export object construction

### Interface

```typescript
interface UseAnalyticsDataOptions {
  startDate: Date;
  endDate: Date;
  comparisonStartDate: Date;
  comparisonEndDate: Date;
  comparisonMode: boolean;
  filters: {
    leadStatus: string;
    conversationStatus: string;
  };
}

interface UseAnalyticsDataReturn {
  // === Raw Data ===
  conversationStats: ConversationStats | null;
  leadStats: LeadStageStats | null;
  stageInfo: StageInfo[];
  agentPerformance: AgentPerformance | null;
  usageMetrics: UsageMetrics | null;
  bookingStats: BookingStats | null;
  satisfactionStats: SatisfactionStats | null;
  aiPerformanceStats: AIPerformanceStats | null;
  trafficData: TrafficData | null;
  articleUsefulnessStats: ArticleUsefulnessStats | null;
  
  // === Comparison Data ===
  comparisonConversationStats: ConversationStats | null;
  comparisonLeadStats: LeadStageStats | null;
  comparisonBookingStats: BookingStats | null;
  
  // === Trend Data ===
  bookingTrend: BookingTrendPoint[];
  satisfactionTrend: SatisfactionTrendPoint[];
  containmentTrend: ContainmentTrendPoint[];
  
  // === Loading States ===
  loading: boolean;
  bookingLoading: boolean;
  satisfactionLoading: boolean;
  aiPerformanceLoading: boolean;
  trafficLoading: boolean;
  
  // === Calculated KPIs ===
  totalConversations: number;
  totalLeads: number;
  conversionRate: string;
  confirmedBookings: number;
  
  // === Trend Values ===
  conversationTrendValue: number;
  leadTrendValue: number;
  conversionTrendValue: number;
  bookingTrendValue: number;
  
  // === Chart Data (processed) ===
  conversationChartData: { value: number }[];
  leadChartData: { value: number }[];
  conversionChartData: { value: number }[];
  bookingChartData: { value: number }[];
  
  // === Report Export ===
  analyticsData: AnalyticsExportData;
  reportExports: ReportExport[];
  scheduledReports: ScheduledReport[];
  exportsLoading: boolean;
  
  // === Actions ===
  refetch: () => void;
  saveExport: (config: ExportConfig) => Promise<void>;
  deleteExport: (id: string) => Promise<void>;
  updateScheduledReport: (report: ScheduledReport) => Promise<void>;
  deleteScheduledReport: (id: string) => Promise<void>;
  
  // === Mock Mode ===
  mockMode: {
    enabled: boolean;
    setEnabled: (enabled: boolean) => void;
    regenerate: () => void;
  };
}
```

### Verification Steps
1. [ ] All KPI values match exactly
2. [ ] All chart data renders identically
3. [ ] Loading states work correctly
4. [ ] Mock mode toggle works
5. [ ] Comparison mode works
6. [ ] Report export works
7. [ ] No TypeScript errors
8. [ ] No console errors

---

## Phase 4: Simplify Analytics.tsx

**Objective**: Reduce Analytics.tsx to ~200-250 lines.  
**Risk Level**: MEDIUM

### Final Structure

```typescript
/**
 * Analytics Page
 * Main analytics dashboard with section navigation.
 * @module pages/Analytics
 */

import { useState, useCallback } from 'react';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { AnalyticsSectionMenu, AnalyticsSection } from '@/components/analytics/AnalyticsSectionMenu';
import { AnalyticsToolbar } from '@/components/analytics/AnalyticsToolbar';
import { BuildReportSheet } from '@/components/analytics/BuildReportSheet';
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

export default function Analytics() {
  // === State ===
  const [activeTab, setActiveTab] = useState<AnalyticsSection>('conversations');
  const [exportSheetOpen, setExportSheetOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date>(...);
  const [endDate, setEndDate] = useState<Date>(...);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonStartDate, setComparisonStartDate] = useState<Date>(...);
  const [comparisonEndDate, setComparisonEndDate] = useState<Date>(...);
  const [filters, setFilters] = useState({ leadStatus: 'all', conversationStatus: 'all' });
  const [reportConfig, setReportConfig] = useState<ReportConfig>({...});

  // === Data ===
  const analyticsData = useAnalyticsData({
    startDate,
    endDate,
    comparisonStartDate,
    comparisonEndDate,
    comparisonMode,
    filters,
  });

  // === Handlers ===
  const handleDateChange = useCallback(...);
  const handleExport = useCallback(...);

  // === Render ===
  return (
    <div className="flex-1 h-full bg-muted/30 flex min-h-0">
      <AnalyticsSectionMenu 
        activeSection={activeTab} 
        onSectionChange={setActiveTab} 
      />
      
      <main className="flex-1 overflow-auto p-6 space-y-6">
        <header>
          <h1>Analytics</h1>
          <AnalyticsToolbar ... />
        </header>

        {activeTab === 'conversations' && (
          <ConversationsSection {...conversationProps} />
        )}
        {activeTab === 'leads' && (
          <LeadsSection {...leadProps} />
        )}
        {activeTab === 'bookings' && (
          <BookingsSection {...bookingProps} />
        )}
        {activeTab === 'ai-performance' && (
          <AIPerformanceSection {...aiProps} />
        )}
        {activeTab === 'sources' && (
          <SourcesSection {...sourceProps} />
        )}
        {activeTab === 'pages' && (
          <PagesSection {...pageProps} />
        )}
        {activeTab === 'geography' && (
          <GeographySection {...geoProps} />
        )}
        {activeTab === 'reports' && (
          <ReportsSection {...reportProps} />
        )}
      </main>

      <BuildReportSheet
        open={exportSheetOpen}
        onOpenChange={setExportSheetOpen}
        config={reportConfig}
        onConfigChange={setReportConfig}
        onExport={handleExport}
        analyticsData={analyticsData.analyticsData}
      />
    </div>
  );
}
```

### Verification Steps
1. [ ] All 8 tabs render correctly
2. [ ] Navigation between tabs works
3. [ ] Date range selection works
4. [ ] Comparison mode works
5. [ ] Mock mode toggle works
6. [ ] Report export (CSV/PDF) works
7. [ ] Scheduled reports section works
8. [ ] No TypeScript errors
9. [ ] No console errors

---

## Phase 5: Update Documentation

**Objective**: Update project documentation to reflect new architecture.

### Files to Update

#### 1. docs/HOOKS_REFERENCE.md
Add `useAnalyticsData` hook documentation:
```markdown
### useAnalyticsData

Consolidated hook for all analytics data fetching and calculations.

**Signature:**
\`\`\`typescript
function useAnalyticsData(options: UseAnalyticsDataOptions): UseAnalyticsDataReturn
\`\`\`

**Parameters:**
- `startDate: Date` - Start of date range
- `endDate: Date` - End of date range
- `comparisonStartDate: Date` - Comparison period start
- `comparisonEndDate: Date` - Comparison period end
- `comparisonMode: boolean` - Enable comparison mode
- `filters: object` - Lead and conversation status filters

**Returns:**
- All analytics data, loading states, KPIs, and actions
- See `src/hooks/useAnalyticsData.ts` for full interface
```

#### 2. docs/APPLICATION_OVERVIEW.md
Update Analytics section with new component architecture.

#### 3. docs/archive/ (Optional)
Archive the original Analytics.tsx structure for reference.

### Verification Steps
1. [ ] HOOKS_REFERENCE.md updated with useAnalyticsData
2. [ ] APPLICATION_OVERVIEW.md reflects new architecture
3. [ ] All links in docs work correctly

---

## Files Summary

### Files to Create (11 total)

| File | Purpose | Lines (Est.) |
|------|---------|--------------|
| `src/lib/analytics-utils.ts` | Utility functions | ~70 |
| `src/hooks/useAnalyticsData.ts` | Consolidated data hook | ~250 |
| `src/components/analytics/sections/ConversationsSection.tsx` | Conversations tab | ~60 |
| `src/components/analytics/sections/LeadsSection.tsx` | Leads tab | ~70 |
| `src/components/analytics/sections/BookingsSection.tsx` | Bookings tab | ~70 |
| `src/components/analytics/sections/AIPerformanceSection.tsx` | AI Performance tab | ~50 |
| `src/components/analytics/sections/SourcesSection.tsx` | Sources tab | ~60 |
| `src/components/analytics/sections/PagesSection.tsx` | Pages tab | ~50 |
| `src/components/analytics/sections/GeographySection.tsx` | Geography tab | ~40 |
| `src/components/analytics/sections/ReportsSection.tsx` | Reports tab | ~40 |
| `src/components/analytics/sections/index.ts` | Barrel exports | ~10 |

### Files to Modify (3 total)

| File | Changes |
|------|---------|
| `src/pages/Analytics.tsx` | Reduce from 881 to ~200 lines |
| `docs/HOOKS_REFERENCE.md` | Add useAnalyticsData documentation |
| `docs/APPLICATION_OVERVIEW.md` | Update Analytics architecture |

---

## Final Verification Checklist

After all phases complete:

### Functional Verification
- [ ] All 8 tabs render correctly
- [ ] Charts animate properly (stacked area grow up/down on chip toggle)
- [ ] Loading skeletons appear during data fetch
- [ ] Empty states display when no data
- [ ] Error boundaries catch and display errors
- [ ] Mock mode toggle works and switches all data
- [ ] Date range selection updates all charts
- [ ] Comparison mode shows comparison data
- [ ] Report export (CSV) works correctly
- [ ] Report export (PDF) works correctly
- [ ] Scheduled reports CRUD operations work
- [ ] Export history displays correctly

### Technical Verification
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] No console errors
- [ ] No console warnings (except expected React dev warnings)
- [ ] All imports resolve correctly
- [ ] No circular dependencies

### Visual Verification
- [ ] All charts match original appearance
- [ ] All KPI cards match original appearance
- [ ] All animations work correctly
- [ ] Responsive design preserved
- [ ] Dark/light mode preserved

---

## Risk Mitigation

1. **Incremental Approach**: Each phase is implemented and verified separately
2. **No Logic Changes**: Only moving code, not modifying behavior
3. **Props Verification**: Each section receives exactly the data it needs
4. **Visual Parity**: Compare before/after for each phase
5. **Rollback Ready**: Each phase can be reverted independently
6. **Type Safety**: TypeScript ensures prop contracts are maintained

---

## Rollback Plan

If issues arise during any phase:

1. **Phase 1**: Remove `analytics-utils.ts`, revert imports in Analytics.tsx
2. **Phase 2**: Remove section components, revert to inline JSX
3. **Phase 3**: Remove `useAnalyticsData.ts`, revert to individual hooks
4. **Phase 4**: Restore original Analytics.tsx from git

Each phase is independent and can be reverted without affecting other phases.

---

## Timeline Estimate

| Phase | Estimated Time |
|-------|----------------|
| Phase 0 | 15 minutes |
| Phase 1 | 20 minutes |
| Phase 2 | 60 minutes |
| Phase 3 | 45 minutes |
| Phase 4 | 30 minutes |
| Phase 5 | 15 minutes |
| **Total** | **~3 hours** |

---

## Approval

- [ ] Plan reviewed and approved
- [ ] Ready to begin Phase 0

---

*Document created: 2025-12-29*  
*Last updated: 2025-12-29*
