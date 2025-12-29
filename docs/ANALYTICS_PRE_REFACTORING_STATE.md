# Analytics Page Pre-Refactoring State Documentation

**Created:** December 29, 2024  
**Status:** ✅ Phase 0 Complete - Verified and Documented  
**File:** `src/pages/Analytics.tsx`  
**Total Lines:** 881  
**Route:** `/analytics`

---

## Table of Contents

1. [File Overview](#file-overview)
2. [Imports and Dependencies](#imports-and-dependencies)
3. [Utility Functions](#utility-functions)
4. [Component State](#component-state)
5. [Data Hooks](#data-hooks)
6. [Mock Data Switching](#mock-data-switching)
7. [KPI Calculations](#kpi-calculations)
8. [Trend Calculations](#trend-calculations)
9. [Section Rendering](#section-rendering)
10. [Error Boundaries](#error-boundaries)
11. [Loading States](#loading-states)
12. [Animation Patterns](#animation-patterns)
13. [Component Props Audit](#component-props-audit)
14. [Verification Checklist](#verification-checklist)

---

## File Overview

The Analytics page is a comprehensive dashboard with 8 distinct sections accessible via a sidebar menu. It supports:
- Real-time data from 6 data hooks
- Mock data mode for testing
- Date range selection with comparison periods
- Report export (CSV/PDF)
- Scheduled report management

### Key Sections (Tabs)

| Section ID | Title | Description | Lines |
|------------|-------|-------------|-------|
| `conversations` | Conversations | Chat sessions and engagement patterns | 635-678 |
| `leads` | Leads | Lead generation and conversion metrics | 680-722 |
| `bookings` | Bookings | Appointment scheduling performance | 724-767 |
| `ai-performance` | Ari Performance | Containment, resolution, satisfaction | 769-788 |
| `sources` | Traffic Sources | Where visitors come from | 790-825 |
| `pages` | Top Pages | Page engagement analytics | 827-841 |
| `geography` | Geography | Visitor locations worldwide | 843-857 |
| `reports` | Reports | Export history and scheduled reports | 859-865 |

---

## Imports and Dependencies

### UI Components (Lines 19-65)
```typescript
// Core UI
import { Button } from '@/components/ui/button';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';
import ErrorBoundary from '@/components/ErrorBoundary';

// Analytics Components
import { AnalyticsSectionMenu, AnalyticsSection } from '@/components/analytics/AnalyticsSectionMenu';
import { ComparisonView } from '@/components/analytics/ComparisonView';
import { ConversationChart } from '@/components/analytics/ConversationChart';
import { LeadConversionChart } from '@/components/analytics/LeadConversionChart';
import { BookingsByLocationChart } from '@/components/analytics/BookingsByLocationChart';
import { BookingTrendChart } from '@/components/analytics/BookingTrendChart';
import { AIPerformanceCard } from '@/components/analytics/AIPerformanceCard';
import { CSATDistributionCard } from '@/components/analytics/CSATDistributionCard';
import { ConversationFunnelCard } from '@/components/analytics/ConversationFunnelCard';
import { PeakActivityChart } from '@/components/analytics/PeakActivityChart';
import { CustomerFeedbackCard } from '@/components/analytics/CustomerFeedbackCard';
import { TrafficSourceChart } from '@/components/analytics/TrafficSourceChart';
import { TrafficSourceTrendChart } from '@/components/analytics/TrafficSourceTrendChart';
import { LeadSourceBreakdownCard } from '@/components/analytics/LeadSourceBreakdownCard';
import { TopPagesChart } from '@/components/analytics/TopPagesChart';
import { LandingPagesTable } from '@/components/analytics/LandingPagesTable';
import { PageEngagementCard } from '@/components/analytics/PageEngagementCard';
import { PageDepthChart } from '@/components/analytics/PageDepthChart';
import { VisitorLocationMap } from '@/components/analytics/VisitorLocationMap';
import { BuildReportSheet, ReportConfig } from '@/components/analytics/BuildReportSheet';
import { ScheduledReportsManager } from '@/components/analytics/ScheduledReportsManager';
import { ExportHistoryTable } from '@/components/analytics/ExportHistoryTable';
import { AnalyticsToolbar } from '@/components/analytics/AnalyticsToolbar';
import { MetricCardWithChart } from '@/components/analytics/MetricCardWithChart';
```

### Hooks (Lines 21-28, 39, 60)
```typescript
import { useAnalytics } from '@/hooks/useAnalytics';
import { useBookingAnalytics } from '@/hooks/useBookingAnalytics';
import { useSatisfactionAnalytics } from '@/hooks/useSatisfactionAnalytics';
import { useAIPerformanceAnalytics } from '@/hooks/useAIPerformanceAnalytics';
import { useTrafficAnalytics } from '@/hooks/useTrafficAnalytics';
import { useMockAnalyticsData } from '@/hooks/useMockAnalyticsData';
import { useConversationFunnel } from '@/hooks/useConversationFunnel';
import { useReportExports } from '@/hooks/useReportExports';
import { useAuth } from '@/hooks/useAuth';
import { useAgent } from '@/hooks/useAgent';
```

### Utilities (Lines 59-67)
```typescript
import { generateCSVReport, generatePDFReport } from '@/lib/report-export';
import { toast } from '@/lib/toast';
import { subDays, format } from 'date-fns';
import { logger } from '@/utils/logger';
import { downloadFile } from '@/lib/file-download';
```

### Icons (Line 54)
```typescript
import { FileCheck02 } from '@untitledui/icons';
```

---

## Utility Functions

### `ensureVisualVariance` (Lines 71-124)
**Purpose:** Adds visual variance to sparse data for smooth sparkline rendering  
**Parameters:** `trend: number[], minPoints: number = 7`  
**Returns:** `number[]`  
**Logic:**
- Empty array → generates baseline sine wave curve
- Fewer than `minPoints` → interpolates with gentle wave
- All zeros/same values → generates wave + uptrend
- Small variance → amplifies differences by 2.5x

### `generateChartData` (Lines 127-130)
**Purpose:** Transforms daily counts into chart data format  
**Parameters:** `dailyCounts: number[]`  
**Returns:** `{ value: number }[]`  
**Logic:** Applies `ensureVisualVariance` then maps to `{ value }` objects

---

## Component State

### Core State (Lines 134-158)
```typescript
const [activeTab, setActiveTab] = useState<AnalyticsSection>('conversations');
const [exportSheetOpen, setExportSheetOpen] = useState(false);

// Date state
const [startDate, setStartDate] = useState(subDays(new Date(), 30));
const [endDate, setEndDate] = useState(new Date());

// Comparison state
const [comparisonMode, setComparisonMode] = useState(false);
const [comparisonStartDate, setComparisonStartDate] = useState(subDays(new Date(), 60));
const [comparisonEndDate, setComparisonEndDate] = useState(subDays(new Date(), 30));

// Filters state
const [filters, setFilters] = useState({
  leadStatus: 'all',
  conversationStatus: 'all',
});
```

### Report Config (Lines 162-184)
```typescript
const [reportConfig, setReportConfig] = useState<ReportConfig>({
  format: 'csv',
  type: 'summary',
  includeConversations: true,
  includeLeads: true,
  includeUsageMetrics: true,
  includeBookings: true,
  includeSatisfaction: true,
  includeAIPerformance: true,
  includeTrafficSources: true,
  includeTopPages: true,
  includeVisitorLocations: true,
  includeAgentPerformance: true,
  grouping: 'day',
  includeKPIs: true,
  includeCharts: true,
  includeTables: true,
});
```

---

## Data Hooks

### 1. useAnalytics (Lines 190-202)
```typescript
const {
  conversationStats: realConversationStats,
  leadStats: realLeadStats,
  agentPerformance,
  usageMetrics: realUsageMetrics,
  bookingTrend: bookingTrendRaw,
  satisfactionTrend: satisfactionTrendRaw,
  containmentTrend: containmentTrendRaw,
  conversations: analyticsConversations,
  leads,
  loading,
  refetch,
} = useAnalytics(startDate, endDate, filters, shouldFetchRealData);
```

### 2. useBookingAnalytics (Lines 205-208)
```typescript
const {
  stats: realBookingStats,
  loading: bookingLoading,
} = useBookingAnalytics(startDate, endDate, shouldFetchRealData);
```

### 3. useSatisfactionAnalytics (Lines 211-214)
```typescript
const {
  stats: realSatisfactionStats,
  loading: satisfactionLoading,
} = useSatisfactionAnalytics(startDate, endDate, shouldFetchRealData);
```

### 4. useAIPerformanceAnalytics (Lines 217-220)
```typescript
const {
  stats: realAIPerformanceStats,
  loading: aiPerformanceLoading,
} = useAIPerformanceAnalytics(startDate, endDate, shouldFetchRealData);
```

### 5. useTrafficAnalytics (Lines 223-233)
```typescript
const {
  trafficSources: realTrafficSources,
  landingPages: realLandingPages,
  pageVisits: realPageVisits,
  locationData: realLocationData,
  engagement: realEngagement,
  sourcesByDate: realSourcesByDate,
  pageDepthDistribution: realPageDepthDistribution,
  leadsBySource: realLeadsBySource,
  loading: trafficLoading,
} = useTrafficAnalytics(startDate, endDate, shouldFetchRealData);
```

### 6. useConversationFunnel (Lines 236-239)
```typescript
const {
  stages: realFunnelStages,
  loading: funnelLoading,
} = useConversationFunnel(startDate, endDate, shouldFetchRealData);
```

### 7. Comparison Data Hooks (Lines 242-253)
```typescript
// Comparison traffic
const {
  trafficSources: comparisonTrafficSources,
  loading: comparisonTrafficLoading,
} = useTrafficAnalytics(comparisonStartDate, comparisonEndDate, comparisonMode && shouldFetchRealData);

// Full comparison data
const comparisonData = useAnalytics(
  comparisonStartDate,
  comparisonEndDate,
  filters,
  comparisonMode && shouldFetchRealData
);
```

---

## Mock Data Switching

### Mock Mode Hook (Line 143)
```typescript
const { enabled: mockMode, setEnabled: setMockMode, mockData, regenerate: regenerateMockData } = useMockAnalyticsData();
```

### Data Switching Pattern (Lines 256-270)
Each data field has a ternary pattern:
```typescript
const conversationStats = mockMode && mockData ? mockData.conversationStats : realConversationStats;
const leadStats = mockMode && mockData ? mockData.leadStats : realLeadStats;
const usageMetrics = mockMode && mockData ? mockData.usageMetrics : realUsageMetrics;
const bookingStats = mockMode && mockData ? mockData.bookingStats : realBookingStats;
const satisfactionStats = mockMode && mockData ? mockData.satisfactionStats : realSatisfactionStats;
const aiPerformanceStats = mockMode && mockData ? mockData.aiPerformanceStats : realAIPerformanceStats;
const trafficSources = mockMode && mockData ? mockData.trafficSources : realTrafficSources;
const landingPages = mockMode && mockData ? mockData.landingPages : realLandingPages;
const pageVisits = mockMode && mockData ? mockData.pageVisits : realPageVisits;
const locationData = mockMode && mockData ? mockData.locationData : realLocationData;
const engagement = mockMode && mockData?.engagement ? mockData.engagement : realEngagement;
const sourcesByDate = mockMode && mockData?.sourcesByDate ? mockData.sourcesByDate : realSourcesByDate;
const pageDepthDistribution = mockMode && mockData?.pageDepthDistribution ? mockData.pageDepthDistribution : realPageDepthDistribution;
const leadsBySource = mockMode && mockData?.leadsBySource ? mockData.leadsBySource : realLeadsBySource;
const funnelStages = mockMode && mockData ? mockData.funnelStages : realFunnelStages;
```

**Total:** 14 data fields with mock/real switching

---

## KPI Calculations

### Core KPIs (Lines 273-291)
```typescript
const totalConversations = conversationStats.reduce((sum, stat) => sum + stat.total, 0);
const totalLeads = leadStats.reduce((sum, stat) => sum + stat.total, 0);
const convertedLeads = leadStats.reduce((sum, stat) => {
  const converted = (stat.converted as number) || (stat.won as number) || 0;
  return sum + converted;
}, 0);
const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0';
const totalMessages = usageMetrics.reduce((sum, metric) => sum + metric.messages, 0);

// Comparison KPIs
const comparisonTotalConversations = comparisonData.conversationStats.reduce(...);
const comparisonTotalLeads = comparisonData.leadStats.reduce(...);
const comparisonConvertedLeads = comparisonData.leadStats.reduce(...);
const comparisonConversionRate = ...;
const comparisonTotalMessages = comparisonData.usageMetrics.reduce(...);
```

### Business Outcome KPIs (Lines 340-342)
```typescript
const totalBookings = bookingStats?.totalBookings ?? 0;
const avgSatisfaction = satisfactionStats?.averageRating ?? 0;
const containmentRate = aiPerformanceStats?.containmentRate ?? 0;
```

---

## Trend Calculations

### `calculatePeriodChange` (Lines 349-361)
**Purpose:** Calculate percentage change between two halves of a trend  
**Used for:** Conversations, Leads, Bookings (count-based metrics)  
**Returns:** Percentage change (e.g., +12.5%)

### `calculatePointChange` (Lines 368-379)
**Purpose:** Calculate absolute point difference  
**Used for:** Satisfaction (1-5 scale), Conversion Rate (%), Containment (%)  
**Returns:** Point difference (e.g., +0.3 points)

### Trend Values (Lines 382-386)
```typescript
const conversationTrendValue = useMemo(() => calculatePeriodChange(conversationTrend), [...]);
const leadTrendValue = useMemo(() => calculatePeriodChange(leadTrend), [...]);
const bookingTrendValue = useMemo(() => calculatePeriodChange(bookingTrend), [...]);
const satisfactionTrendValue = useMemo(() => calculatePointChange(satisfactionTrend), [...]);
const aiContainmentTrendValue = useMemo(() => calculatePointChange(containmentTrend), [...]);
```

---

## Section Rendering

### Section Info Mapping (Lines 576-585)
```typescript
const sectionInfo: Record<AnalyticsSection, { title: string; description: string }> = {
  'conversations': { title: 'Conversations', description: 'Analyze chat sessions and engagement patterns' },
  'leads': { title: 'Leads', description: 'Track lead generation and conversion metrics' },
  'bookings': { title: 'Bookings', description: 'Monitor appointment scheduling performance' },
  'ai-performance': { title: 'Ari Performance', description: 'Measure Ari containment, resolution, and satisfaction' },
  'sources': { title: 'Traffic Sources', description: 'Understand where your visitors come from' },
  'pages': { title: 'Top Pages', description: 'See which pages drive the most engagement' },
  'geography': { title: 'Geography', description: 'View visitor locations around the world' },
  'reports': { title: 'Reports', description: 'View export history and manage scheduled reports' },
};
```

### Toolbar Visibility (Lines 588-590)
```typescript
const showToolbar = ['conversations', 'leads', 'bookings', 'ai-performance', 'sources', 'pages', 'geography'].includes(activeTab);
const showBuildReport = activeTab === 'reports';
```

---

## Error Boundaries

Each major chart/component wrapped in ErrorBoundary with consistent fallback pattern:

```typescript
<ErrorBoundary
  fallback={(error) => (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm font-medium text-foreground">{componentName} failed to load</p>
      <p className="text-xs text-muted-foreground mt-1">{error?.message || 'An unexpected error occurred.'}</p>
    </div>
  )}
>
  <Component {...props} />
</ErrorBoundary>
```

### Components with ErrorBoundary:
1. **PeakActivityChart** (Lines 638-650)
2. **ConversationChart** (Lines 655-668)
3. **LeadConversionChart** (Lines 709-718)
4. **BookingTrendChart** (Lines 749-763)
5. **TrafficSourceTrendChart** (Lines 809-821)
6. **VisitorLocationMap** (Lines 846-855)

---

## Loading States

### Loading Flags
| Hook | Loading Flag |
|------|--------------|
| useAnalytics | `loading` |
| useBookingAnalytics | `bookingLoading` |
| useSatisfactionAnalytics | `satisfactionLoading` |
| useAIPerformanceAnalytics | `aiPerformanceLoading` |
| useTrafficAnalytics | `trafficLoading` |
| useConversationFunnel | `funnelLoading` |
| useTrafficAnalytics (comparison) | `comparisonTrafficLoading` |

### Loading Prop Usage
All chart components receive their respective `loading` prop:
- `PeakActivityChart` → `loading={loading}`
- `BookingsByLocationChart` → `loading={bookingLoading}`
- `CSATDistributionCard` → `loading={satisfactionLoading}`
- `AIPerformanceCard` → `loading={aiPerformanceLoading}`
- `TrafficSourceChart` → `loading={trafficLoading || (comparisonMode && comparisonTrafficLoading)}`
- etc.

---

## Animation Patterns

### AnimatedList + AnimatedItem Pattern
Used in all sections for staggered reveal animations:
```typescript
<AnimatedList className="space-y-6" staggerDelay={0.1}>
  <AnimatedItem>
    <Component />
  </AnimatedItem>
</AnimatedList>
```

### MetricCardWithChart Animation
Uses `animationDelay` prop for staggered card reveals:
```typescript
<MetricCardWithChart animationDelay={0} ... />
<MetricCardWithChart animationDelay={0.05} ... />
```

---

## Component Props Audit

### Section: Conversations
| Component | Props |
|-----------|-------|
| PeakActivityChart | `conversationStats`, `loading` |
| ConversationChart | `data`, `trendValue`, `trendPeriod` |
| ConversationFunnelCard | `stages`, `loading` |

### Section: Leads
| Component | Props |
|-----------|-------|
| MetricCardWithChart (Total Leads) | `title`, `subtitle`, `description`, `change`, `changeType`, `changeLabel`, `chartData`, `animationDelay` |
| MetricCardWithChart (Conversion Rate) | Same as above with `changeType="points"` |
| LeadConversionChart | `data`, `trendValue`, `trendPeriod` |

### Section: Bookings
| Component | Props |
|-----------|-------|
| MetricCardWithChart (Total Bookings) | `title`, `subtitle`, `description`, `change`, `changeType`, `changeLabel`, `chartData`, `animationDelay` |
| BookingsByLocationChart | `data`, `loading`, `animationDelay` |
| BookingTrendChart | `data`, `loading`, `trendValue`, `trendPeriod` |

### Section: AI Performance
| Component | Props |
|-----------|-------|
| AIPerformanceCard | `containmentRate`, `resolutionRate`, `totalConversations`, `humanTakeover`, `loading`, `trendValue`, `trendPeriod` |
| CSATDistributionCard | `distribution`, `averageRating`, `totalRatings`, `loading` |
| CustomerFeedbackCard | `data`, `loading` |

### Section: Sources
| Component | Props |
|-----------|-------|
| TrafficSourceChart | `data`, `loading`, `comparisonData`, `engagement` |
| LeadSourceBreakdownCard | `data`, `loading` |
| TrafficSourceTrendChart | `data`, `loading` |

### Section: Pages
| Component | Props |
|-----------|-------|
| PageEngagementCard | `engagement`, `loading` |
| TopPagesChart | `data`, `loading` |
| PageDepthChart | `data`, `loading` |
| LandingPagesTable | `data`, `loading` |

### Section: Geography
| Component | Props |
|-----------|-------|
| VisitorLocationMap | `data`, `loading` |

### Section: Reports
| Component | Props |
|-----------|-------|
| ExportHistoryTable | (none - uses internal hooks) |
| ScheduledReportsManager | (none - uses internal hooks) |

---

## Verification Checklist

### ✅ Pre-Refactoring Verification Complete

- [x] File analyzed: 881 lines total
- [x] Route confirmed: `/analytics`
- [x] All 8 sections identified and documented
- [x] All imports catalogued (37 imports)
- [x] Utility functions documented (2 functions)
- [x] Component state documented (9 state variables)
- [x] Data hooks documented (7 hook calls)
- [x] Mock data switching documented (14 fields)
- [x] KPI calculations documented (8 KPIs)
- [x] Trend calculations documented (5 trend values)
- [x] Error boundaries documented (6 components wrapped)
- [x] Loading states documented (7 loading flags)
- [x] Animation patterns documented
- [x] All component props audited (27 component instances)

### Files Reviewed
- `src/pages/Analytics.tsx` (881 lines) - Complete review
- `src/App.tsx` - Route confirmation
- `src/components/Sidebar.tsx` - Navigation confirmation

---

## Ready for Phase 1

With this documentation complete, we can proceed to Phase 1 (Extract Utility Functions) with full confidence that:

1. All current functionality is documented
2. All props are catalogued for each component
3. All data flows are understood
4. All error handling patterns are preserved
5. All animation patterns are documented

**Next Step:** Create `src/lib/analytics-utils.ts` with `ensureVisualVariance` and `generateChartData` functions.
