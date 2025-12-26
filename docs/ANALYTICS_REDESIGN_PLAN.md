# Analytics Page Redesign - Implementation Plan

> **Status**: In Progress  
> **Created**: 2025-12-26  
> **Last Updated**: 2025-12-26

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

### Phase 2: Booking Analytics Hook
**File**: `src/hooks/useBookingAnalytics.ts`

- [ ] Create hook with proper JSDoc header
- [ ] Accept `startDate` and `endDate` parameters
- [ ] Query `calendar_events` table with date filter
- [ ] Join with `locations` table for location names
- [ ] Filter by user's agent via `connected_accounts`
- [ ] Calculate total bookings
- [ ] Calculate show rate
- [ ] Group by location
- [ ] Group by status
- [ ] Generate trend data (daily aggregation)
- [ ] Return `BookingStats` interface
- [ ] Add real-time subscription
- [ ] Add proper loading/error states

**Query Pattern:**
```typescript
const { data: bookings } = await supabase
  .from('calendar_events')
  .select(`
    id,
    status,
    start_time,
    location_id,
    locations!fk_events_location (
      id,
      name
    )
  `)
  .gte('start_time', startDate.toISOString())
  .lte('start_time', endDate.toISOString())
  .in('connected_account_id', connectedAccountIds);
```

---

### Phase 3: Satisfaction Analytics Hook
**File**: `src/hooks/useSatisfactionAnalytics.ts`

- [ ] Create hook with proper JSDoc header
- [ ] Accept `startDate` and `endDate` parameters
- [ ] Query `conversation_ratings` table
- [ ] Join with `conversations` for user_id filtering
- [ ] Calculate average rating
- [ ] Calculate distribution (count per 1-5 star)
- [ ] Generate trend data (daily avg)
- [ ] Fetch recent feedback with comments
- [ ] Return `SatisfactionStats` interface
- [ ] Add real-time subscription
- [ ] Add proper loading/error states

---

### Phase 4: AI Performance Analytics Hook
**File**: `src/hooks/useAIPerformanceAnalytics.ts`

- [ ] Create hook with proper JSDoc header
- [ ] Accept `startDate` and `endDate` parameters
- [ ] Query `conversations` for total count
- [ ] Query `conversations` grouped by status (active/closed)
- [ ] Query `conversation_takeovers` for human intervention count
- [ ] Calculate containment rate: `(total - takeovers) / total * 100`
- [ ] Calculate resolution rate: `closed / total * 100`
- [ ] Return `AIPerformanceStats` interface
- [ ] Add real-time subscription
- [ ] Add proper loading/error states

---

### Phase 5: Chart Components

#### 5a. BookingsByLocationChart
**File**: `src/components/analytics/BookingsByLocationChart.tsx`

- [ ] Create component with proper JSDoc header
- [ ] Define `BookingsByLocationChartProps` interface
- [ ] Use horizontal `BarChart` from Recharts (`layout=\"vertical\"`)
- [ ] Match existing chart styling (margins, fonts, grids)
- [ ] Use `hsl(var(--primary))` for bar fill
- [ ] Use `ChartTooltipContent` from `charts-base.tsx`
- [ ] Add skeleton loading state
- [ ] Add empty state when no data
- [ ] Wrap in `Card` component

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

- [ ] Create component with proper JSDoc header
- [ ] Define `BookingStatusChartProps` interface
- [ ] Use `PieChart` with `innerRadius` for donut style
- [ ] Match `TrafficSourceChart` pattern exactly
- [ ] Center label shows show rate percentage
- [ ] Use semantic colors:
  - Completed: `hsl(var(--success))`
  - Pending: `hsl(var(--primary))`
  - Cancelled: `hsl(var(--destructive))`
  - No-show: `hsl(var(--muted-foreground))`
- [ ] Add legend below chart
- [ ] Add skeleton loading state
- [ ] Add empty state when no data
- [ ] Wrap in `Card` component

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

- [ ] Create component with proper JSDoc header
- [ ] Define `SatisfactionScoreCardProps` interface
- [ ] Display large average rating (e.g., \"4.2\")
- [ ] Display star icons using `Star01` from UntitledUI (filled/outline based on rating)
- [ ] Display total ratings count
- [ ] Display horizontal distribution bars for each 1-5 rating
- [ ] Use `Progress` component for distribution bars
- [ ] Add skeleton loading state
- [ ] Add empty state when no ratings
- [ ] Wrap in `Card` component

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

- [ ] Create component with proper JSDoc header
- [ ] Define `AIPerformanceCardProps` interface
- [ ] Display containment rate as percentage with progress ring/bar
- [ ] Display resolution rate as percentage with progress ring/bar
- [ ] Use `Progress` component with appropriate colors
- [ ] Add descriptive labels (\"AI Handled\", \"Human Takeover\")
- [ ] Use `Bot` or `Cpu01` icon from UntitledUI
- [ ] Add skeleton loading state
- [ ] Add empty state when no conversations
- [ ] Wrap in `Card` component
- [ ] **DO NOT include response time** (excluded per user request)

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

- [ ] Create component with proper JSDoc header
- [ ] Display \"Coming Soon\" badge
- [ ] Show placeholder icon (Ticket02 from UntitledUI)
- [ ] Gray out / reduce opacity for disabled state
- [ ] Brief description of what will be tracked
- [ ] Wrap in `Card` component

---

### Phase 6: Update useAnalytics Hook
**File**: `src/hooks/useAnalytics.ts`

- [ ] Add booking trend data for sparkline KPI
- [ ] Add satisfaction trend data for sparkline KPI
- [ ] Add containment rate trend data for sparkline KPI
- [ ] Keep existing `conversationStats` logic
- [ ] Keep existing `leadStats` logic
- [ ] Remove any multi-agent filtering remnants
- [ ] Update return type to include new trend data

**New Return Shape:**
```typescript
return {
  // Existing
  conversationStats,
  leadStats,
  stageInfo,
  rawConversations,
  rawLeads,
  loading,
  refetch,
  
  // New additions
  bookingTrend: BookingTrendData[],
  satisfactionTrend: SatisfactionTrendData[],
  containmentTrend: { date: string; rate: number }[],
};
```

---

### Phase 7: Update Analytics Page
**File**: `src/pages/Analytics.tsx`

- [ ] Import new hooks: `useBookingAnalytics`, `useSatisfactionAnalytics`, `useAIPerformanceAnalytics`
- [ ] Import new components
- [ ] Update KPI cards row:
  - [ ] Keep \"Total Conversations\" sparkline
  - [ ] Keep \"Total Leads\" sparkline
  - [ ] Keep \"Conversion Rate\" sparkline
  - [ ] Add \"Total Bookings\" sparkline (NEW)
  - [ ] Add \"Avg Satisfaction\" sparkline (NEW)
  - [ ] Add \"Containment Rate\" sparkline (NEW)
- [ ] Add new chart grid section:
  - [ ] `BookingsByLocationChart` (left)
  - [ ] `SatisfactionScoreCard` (right)
  - [ ] `LeadConversionChart` (left) - KEEP EXISTING
  - [ ] `AIPerformanceCard` (right) - REPLACES AgentPerformanceChart
  - [ ] `BookingStatusChart` (left)
  - [ ] `TicketsResolvedCard` (right)
- [ ] Keep existing `ConversationChart` full-width
- [ ] Keep existing tab structure (Overview, Traffic, Data Table)
- [ ] Ensure responsive grid layout

**Layout Grid:**
```
grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
```

---

### Phase 8: Cleanup

- [ ] Delete `src/components/analytics/AgentPerformanceChart.tsx` (replaced by AIPerformanceCard)
- [ ] Delete `src/components/analytics/UsageMetricsChart.tsx` (if not used elsewhere)
- [ ] Remove unused imports from Analytics.tsx
- [ ] Remove any dead code

---

### Phase 9: Documentation Updates

#### HOOKS_REFERENCE.md
- [ ] Add `useBookingAnalytics` documentation
- [ ] Add `useSatisfactionAnalytics` documentation
- [ ] Add `useAIPerformanceAnalytics` documentation

#### DATABASE_SCHEMA.md
- [ ] Document `conversation_ratings` table usage
- [ ] Document `conversation_takeovers` table usage
- [ ] Document `article_feedback` table usage

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
| CREATE | `src/hooks/useBookingAnalytics.ts` | ⬜ Pending |
| CREATE | `src/hooks/useSatisfactionAnalytics.ts` | ⬜ Pending |
| CREATE | `src/hooks/useAIPerformanceAnalytics.ts` | ⬜ Pending |
| CREATE | `src/components/analytics/BookingsByLocationChart.tsx` | ⬜ Pending |
| CREATE | `src/components/analytics/BookingStatusChart.tsx` | ⬜ Pending |
| CREATE | `src/components/analytics/SatisfactionScoreCard.tsx` | ⬜ Pending |
| CREATE | `src/components/analytics/AIPerformanceCard.tsx` | ⬜ Pending |
| CREATE | `src/components/analytics/TicketsResolvedCard.tsx` | ⬜ Pending |
| MODIFY | `src/hooks/useAnalytics.ts` | ⬜ Pending |
| MODIFY | `src/pages/Analytics.tsx` | ⬜ Pending |
| DELETE | `src/components/analytics/AgentPerformanceChart.tsx` | ⬜ Pending |
| DELETE | `src/components/analytics/UsageMetricsChart.tsx` | ⬜ Pending |
| UPDATE | `docs/HOOKS_REFERENCE.md` | ⬜ Pending |
| UPDATE | `docs/DATABASE_SCHEMA.md` | ⬜ Pending |

---

## Notes

- **Excluded Metric**: First Response Time (per user request)
- **Placeholder**: Tickets Resolved is \"Coming Soon\" until tickets feature is built
- **Preserved**: All existing sparkline MetricCardWithChart components
- **Preserved**: LeadConversionChart, ConversationChart, TrafficSourceChart
- **Single Agent Model**: All analytics are for \"Ari\" only (no multi-agent filtering)
