# Analytics Page Redesign - Implementation Plan

> **Status**: ✅ COMPLETE  
> **Created**: 2025-12-26  
> **Completed**: 2025-12-26

## Overview

Redesigning the Analytics page to focus on **business-outcome metrics** rather than vanity metrics. The goal is to provide actionable insights that matter: bookings, satisfaction, lead conversions, and AI performance.

---

## Design System Requirements

All implementations MUST follow these standards:

### Color Tokens (NEVER raw colors)
```css
/* Backgrounds */
bg-background, bg-card, bg-muted, bg-accent

/* Text */
text-foreground, text-muted-foreground

/* Status Colors */
bg-status-active/10 text-status-active
bg-status-draft/10 text-status-draft
bg-success/10 text-success
bg-destructive/10 text-destructive

/* Chart Colors */
hsl(var(--chart-1)) through hsl(var(--chart-5))
hsl(var(--primary)), hsl(var(--success)), hsl(var(--warning))

/* Borders */
border-border, border-input
```

### Typography Tokens (NEVER arbitrary text-[*px])
```css
text-2xs (10px), text-xs (12px), text-sm (14px), text-base (16px)
text-lg (18px), text-xl (20px), text-2xl (24px), text-3xl (30px)
```

### Icons
- **ONLY** use `@untitledui/icons` - NEVER Lucide
- Import pattern: `import { IconName } from '@untitledui/icons/react/icons';`
- Standard sizes: `size={16}` small, `size={20}` default, `size={24}` large

### Component Patterns
- Use shadcn `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardDescription`
- Use existing `Skeleton` for loading states
- Use existing `EmptyState` component for no-data states
- All interactive elements need `aria-label` for WCAG 2.2 compliance

### Type Safety
- All props must have TypeScript interfaces
- All hooks must have proper return type annotations
- Use `Database` types from `@/integrations/supabase/types` for DB queries
- JSDoc headers on all new files

---

## Metrics to Track

### Tier 1: Core Business Outcomes
| Metric | Source Table | Calculation |
|--------|--------------|-------------|
| Total Bookings | `calendar_events` | COUNT where date in range |
| Booking Show Rate | `calendar_events` | `completed / (completed + cancelled + no_show) * 100` |
| Avg Satisfaction | `conversation_ratings` | AVG(rating) where 1-5 scale |
| Lead Conversion Rate | `leads` + `lead_stages` | Leads in \"Converted\" stage / total leads |

### Tier 2: AI Performance
| Metric | Source Table | Calculation |
|--------|--------------|-------------|
| Containment Rate | `conversations` + `conversation_takeovers` | `(total - takeovers) / total * 100` |
| Resolution Rate | `conversations` | `closed / total * 100` |
| ~~First Response Time~~ | ~~messages~~ | **EXCLUDED per user request** |

### Tier 3: Engagement Quality
| Metric | Source Table | Calculation |
|--------|--------------|-------------|
| Help Article Usefulness | `article_feedback` | `helpful / total * 100` |
| Tickets Resolved | N/A | **COMING SOON** placeholder |

---

## Implementation Phases

### Phase 1: Type Definitions ✅ COMPLETE
**File**: `src/types/analytics.ts`

- [x] Create `BookingStats` interface
- [x] Create `LocationBookingData` interface
- [x] Create `BookingStatusData` interface
- [x] Create `BookingTrendData` interface
- [x] Create `SatisfactionStats` interface
- [x] Create `RatingDistribution` interface
- [x] Create `SatisfactionTrendData` interface
- [x] Create `FeedbackItem` interface
- [x] Create `AIPerformanceStats` interface
- [x] Create `ArticleUsefulnessStats` interface
- [x] Create `AIPerformanceTrendData` interface
- [x] Create `ArticleUsefulnessItem` interface
- [x] Create `AnalyticsDateRange` interface
- [x] Create `SparklineDataPoint` interface
- [x] Create `AnalyticsDashboardData` interface
- [x] Create `BaseChartProps` interface
- [x] Create all chart component prop interfaces
- [x] Export from `src/types/index.ts`

**Type Definitions:**
```typescript
// Booking Analytics
export interface BookingStats {
  totalBookings: number;
  showRate: number;
  byLocation: LocationBookingData[];
  byStatus: BookingStatusData[];
  trend: BookingTrendData[];
}

export interface LocationBookingData {
  locationId: string;
  locationName: string;
  bookings: number;
  completed: number;
  cancelled: number;
  noShow: number;
}

export interface BookingStatusData {
  status: 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'pending';
  count: number;
  percentage: number;
  color: string; // Design system token
}

export interface BookingTrendData {
  date: string;
  total: number;
  completed: number;
  cancelled: number;
}

// Satisfaction Analytics
export interface SatisfactionStats {
  averageRating: number;
  totalRatings: number;
  distribution: RatingDistribution[];
  trend: SatisfactionTrendData[];
  recentFeedback: FeedbackItem[];
}

export interface RatingDistribution {
  rating: number; // 1-5
  count: number;
  percentage: number;
}

export interface SatisfactionTrendData {
  date: string;
  avgRating: number;
  count: number;
}

export interface FeedbackItem {
  id: string;
  rating: number;
  feedback: string | null;
  createdAt: string;
  conversationId: string;
}

// AI Performance Analytics
export interface AIPerformanceStats {
  containmentRate: number;
  resolutionRate: number;
  totalConversations: number;
  aiHandled: number;
  humanTakeover: number;
  closedConversations: number;
  activeConversations: number;
}

// Article Usefulness
export interface ArticleUsefulnessStats {
  helpfulPercentage: number;
  totalFeedback: number;
  helpful: number;
  notHelpful: number;
}
```

---

### Phase 2: Data Hooks ✅ COMPLETE

#### useBookingAnalytics
**File**: `src/hooks/useBookingAnalytics.ts`

- [x] Create hook with proper JSDoc header
- [x] Accept `startDate` and `endDate` parameters
- [x] Query `calendar_events` table with date filter
- [x] Join with `locations` table for location names
- [x] Filter by user's agent via `connected_accounts`
- [x] Calculate total bookings
- [x] Calculate show rate
- [x] Group by location
- [x] Group by status
- [x] Generate trend data (daily aggregation)
- [x] Return `BookingStats` interface
- [x] Add real-time subscription
- [x] Add proper loading/error states

#### useSatisfactionAnalytics
**File**: `src/hooks/useSatisfactionAnalytics.ts`

- [x] Create hook with proper JSDoc header
- [x] Accept `startDate` and `endDate` parameters
- [x] Query `conversation_ratings` table
- [x] Join with `conversations` for user_id filtering
- [x] Calculate average rating
- [x] Calculate distribution (count per 1-5 star)
- [x] Generate trend data (daily avg)
- [x] Fetch recent feedback with comments
- [x] Return `SatisfactionStats` interface
- [x] Add real-time subscription
- [x] Add proper loading/error states

#### useAIPerformanceAnalytics
**File**: `src/hooks/useAIPerformanceAnalytics.ts`

- [x] Create hook with proper JSDoc header
- [x] Accept `startDate` and `endDate` parameters
- [x] Query `conversations` for total count
- [x] Query `conversations` grouped by status (active/closed)
- [x] Query `conversation_takeovers` for human intervention count
- [x] Calculate containment rate: `(total - takeovers) / total * 100`
- [x] Calculate resolution rate: `closed / total * 100`
- [x] Return `AIPerformanceStats` interface
- [x] Add real-time subscription (on conversations table)
- [x] Add proper loading/error states
- [x] Add trend data for sparklines (bonus)

---

### Phase 5: Chart Components ✅ COMPLETE

#### 5a. BookingsByLocationChart
**File**: `src/components/analytics/BookingsByLocationChart.tsx`

- [x] Create component with proper JSDoc header
- [x] Define `BookingsByLocationChartProps` interface
- [x] Use horizontal `BarChart` from Recharts (`layout="vertical"`)
- [x] Match existing chart styling (margins, fonts, grids)
- [x] Use `hsl(var(--primary))` for bar fill
- [x] Use `ChartTooltipContent` from `charts-base.tsx`
- [x] Add skeleton loading state
- [x] Add empty state when no data
- [x] Wrap in `Card` component

**Props:**
```typescript
interface BookingsByLocationChartProps {
  data: LocationBookingData[];
  loading?: boolean;
  className?: string;
}
```

#### 5b. BookingStatusChart
**File**: `src/components/analytics/BookingStatusChart.tsx`

- [x] Create component with proper JSDoc header
- [x] Define `BookingStatusChartProps` interface
- [x] Use `PieChart` with `innerRadius` for donut style
- [x] Match `TrafficSourceChart` pattern exactly
- [x] Center label shows show rate percentage
- [x] Use semantic colors:
  - Completed: `hsl(var(--success))`
  - Pending: `hsl(var(--primary))`
  - Cancelled: `hsl(var(--destructive))`
  - No-show: `hsl(var(--muted-foreground))`
- [x] Add legend below chart
- [x] Add skeleton loading state
- [x] Add empty state when no data
- [x] Wrap in `Card` component

**Props:**
```typescript
interface BookingStatusChartProps {
  data: BookingStatusData[];
  showRate: number;
  loading?: boolean;
  className?: string;
}
```

#### 5c. SatisfactionScoreCard
**File**: `src/components/analytics/SatisfactionScoreCard.tsx`

- [x] Create component with proper JSDoc header
- [x] Define `SatisfactionScoreCardProps` interface
- [x] Display large average rating (e.g., "4.2")
- [x] Display star icons using `Star01` from UntitledUI (filled/outline based on rating)
- [x] Display total ratings count
- [x] Display horizontal distribution bars for each 1-5 rating
- [x] Use `Progress` component for distribution bars
- [x] Add skeleton loading state
- [x] Add empty state when no ratings
- [x] Wrap in `Card` component

**Props:**
```typescript
interface SatisfactionScoreCardProps {
  averageRating: number;
  totalRatings: number;
  distribution: RatingDistribution[];
  loading?: boolean;
  className?: string;
}
```

#### 5d. AIPerformanceCard
**File**: `src/components/analytics/AIPerformanceCard.tsx`

- [x] Create component with proper JSDoc header
- [x] Define `AIPerformanceCardProps` interface
- [x] Display containment rate as percentage with progress ring/bar
- [x] Display resolution rate as percentage with progress ring/bar
- [x] Use `Progress` component with appropriate colors
- [x] Add descriptive labels ("AI Handled", "Human Takeover")
- [x] Use `Bot` or `Cpu01` icon from UntitledUI
- [x] Add skeleton loading state
- [x] Add empty state when no conversations
- [x] Wrap in `Card` component
- [x] **DO NOT include response time** (excluded per user request)

**Props:**
```typescript
interface AIPerformanceCardProps {
  stats: AIPerformanceStats;
  loading?: boolean;
  className?: string;
}
```

#### 5e. TicketsResolvedCard
**File**: `src/components/analytics/TicketsResolvedCard.tsx`

- [x] Create component with proper JSDoc header
- [x] Display "Coming Soon" badge
- [x] Show placeholder icon (Ticket02 from UntitledUI)
- [x] Gray out / reduce opacity for disabled state
- [x] Brief description of what will be tracked
- [x] Wrap in `Card` component

---

### Phase 6: Update useAnalytics Hook ✅ COMPLETE
**File**: `src/hooks/useAnalytics.ts`

- [x] Add booking trend data for sparkline KPI
- [x] Add satisfaction trend data for sparkline KPI
- [x] Add containment rate trend data for sparkline KPI
- [x] Keep existing `conversationStats` logic
- [x] Keep existing `leadStats` logic
- [x] Remove any multi-agent filtering remnants
- [x] Update return type to include new trend data
- [x] Add real-time subscriptions for calendar_events and conversation_ratings

**New Return Shape:**
```typescript
return {
  // Existing
  conversationStats,
  leadStats,
  stageInfo,
  agentPerformance,
  usageMetrics,
  conversations,
  leads,
  loading,
  refetch,
  
  // New additions
  bookingTrend: SparklineDataPoint[],
  satisfactionTrend: SparklineDataPoint[],
  containmentTrend: SparklineDataPoint[],
};
```

---

### Phase 7: Update Analytics Page ✅ COMPLETE
**File**: `src/pages/Analytics.tsx`

- [x] Import new hooks: `useBookingAnalytics`, `useSatisfactionAnalytics`, `useAIPerformanceAnalytics`
- [x] Import new components
- [x] Update KPI cards row:
  - [x] Keep "Total Conversations" sparkline
  - [x] Keep "Total Leads" sparkline
  - [x] Keep "Conversion Rate" sparkline
  - [x] Add "Total Bookings" sparkline (NEW)
  - [x] Add "Avg Satisfaction" sparkline (NEW)
  - [x] Add "Containment Rate" sparkline (NEW)
- [x] Add new chart grid section:
  - [x] `BookingsByLocationChart` (left)
  - [x] `SatisfactionScoreCard` (right)
  - [x] `LeadConversionChart` (left) - KEEP EXISTING
  - [x] `AIPerformanceCard` (right) - REPLACES AgentPerformanceChart
  - [x] `BookingStatusChart` (left)
  - [x] `TicketsResolvedCard` (right)
- [x] Keep existing `ConversationChart` full-width
- [x] Keep existing tab structure (Overview, Traffic, Reports, Schedule)
- [x] Ensure responsive grid layout (6-column on xl, 3-column on lg, 2-column on sm)

**Layout Grid:**
```
KPIs: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6
Charts: grid-cols-1 lg:grid-cols-2 gap-6
```

---

### Phase 8: Cleanup ✅ COMPLETE

- [x] Delete `src/components/analytics/AgentPerformanceChart.tsx` (replaced by AIPerformanceCard)
- [x] Delete `src/components/analytics/UsageMetricsChart.tsx` (if not used elsewhere)
- [x] Remove unused imports from Analytics.tsx
- [x] Remove any dead code

---

### Phase 9: Documentation Updates ✅ COMPLETE

#### HOOKS_REFERENCE.md
- [x] Add `useBookingAnalytics` documentation (already existed)
- [x] Add `useSatisfactionAnalytics` documentation (already existed)
- [x] Add `useAIPerformanceAnalytics` documentation (already existed)

#### DATABASE_SCHEMA.md
- [x] Document `conversation_ratings` table usage
- [x] Document `conversation_takeovers` table usage
- [x] Document `article_feedback` table usage
- [x] Add Analytics Usage section with calculation formulas
- [x] Add new hooks to React Hooks Reference table

---

## Testing Checklist

- [ ] Verify all KPI sparkline cards render correctly
- [ ] Verify BookingsByLocationChart shows location names
- [ ] Verify BookingStatusChart shows correct percentages
- [ ] Verify SatisfactionScoreCard shows stars correctly
- [ ] Verify AIPerformanceCard shows containment/resolution rates
- [ ] Verify date range filtering works on all new charts
- [ ] Verify loading states display correctly
- [ ] Verify empty states display correctly
- [ ] Verify responsive layout on mobile/tablet/desktop
- [ ] Verify dark mode colors work correctly
- [ ] Verify WCAG 2.2 accessibility (focus states, aria-labels)
- [ ] Verify real-time updates work

---

## Files Summary

| Action | File | Status |
|--------|------|--------|
| CREATE | `src/types/analytics.ts` | ✅ Complete |
| CREATE | `src/hooks/useBookingAnalytics.ts` | ✅ Complete |
| CREATE | `src/hooks/useSatisfactionAnalytics.ts` | ✅ Complete |
| CREATE | `src/hooks/useAIPerformanceAnalytics.ts` | ✅ Complete |
| CREATE | `src/components/analytics/BookingsByLocationChart.tsx` | ✅ Complete |
| CREATE | `src/components/analytics/BookingStatusChart.tsx` | ✅ Complete |
| CREATE | `src/components/analytics/SatisfactionScoreCard.tsx` | ✅ Complete |
| CREATE | `src/components/analytics/AIPerformanceCard.tsx` | ✅ Complete |
| CREATE | `src/components/analytics/TicketsResolvedCard.tsx` | ✅ Complete |
| MODIFY | `src/hooks/useAnalytics.ts` | ✅ Complete |
| MODIFY | `src/pages/Analytics.tsx` | ✅ Complete |
| DELETE | `src/components/analytics/AgentPerformanceChart.tsx` | ✅ Deleted |
| DELETE | `src/components/analytics/UsageMetricsChart.tsx` | ✅ Deleted |
| UPDATE | `docs/HOOKS_REFERENCE.md` | ✅ Complete |
| UPDATE | `src/lib/query-keys.ts` | ✅ Complete |
| UPDATE | `docs/DATABASE_SCHEMA.md` | ✅ Complete |

---

## Notes

- **Excluded Metric**: First Response Time (per user request)
- **Placeholder**: Tickets Resolved is \"Coming Soon\" until tickets feature is built
- **Preserved**: All existing sparkline MetricCardWithChart components
- **Preserved**: LeadConversionChart, ConversationChart, TrafficSourceChart
- **Single Agent Model**: All analytics are for \"Ari\" only (no multi-agent filtering)
