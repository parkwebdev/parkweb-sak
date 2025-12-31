# PDF Generator Architecture

## Overview

The Pilot PDF generator creates analytics reports using `@react-pdf/renderer` with native vector chart components. This provides crisp, scalable graphics that render identically across all PDF viewers.

## Architecture

```
src/lib/pdf-components/
├── AnalyticsReportPDF.tsx    # Main document component
├── PDFHeader.tsx             # Report header with branding
├── PDFFooter.tsx             # Page footer with page numbers
├── PDFKPICards.tsx           # KPI summary cards
├── PDFTable.tsx              # Data tables
├── PDFSection.tsx            # Section containers
├── fonts.ts                  # Font registration (Inter)
├── styles.ts                 # Design system tokens
├── index.ts                  # Public exports
└── charts/
    ├── PDFLineChart.tsx      # Line/trend charts
    ├── PDFBarChart.tsx       # Vertical & horizontal bars
    ├── PDFPieChart.tsx       # Pie & donut charts
    ├── PDFStackedBarChart.tsx# Stacked bar charts
    ├── pdf-chart-utils.ts    # Scaling, formatting, colors
    └── index.ts              # Chart exports
```

## Data Flow

```
Analytics.tsx (UI)
    ↓
buildPDFData()          # Transforms analytics data to PDFData
    ↓
generateBeautifulPDF()  # Creates PDF blob
    ↓
AnalyticsReportPDF      # React component tree
    ↓
@react-pdf/renderer     # Renders to PDF
```

---

## Type Definitions

### ReportType

```typescript
type ReportType = 'summary' | 'detailed' | 'comparison';
```

| Value | Description |
|-------|-------------|
| `summary` | High-level overview with key metrics |
| `detailed` | Complete breakdown with all data tables |
| `comparison` | Side-by-side period comparison |

### PDFData

Complete data structure for PDF reports. All fields are optional.

```typescript
interface PDFData {
  // Core metrics
  totalConversations?: number;
  conversationsChange?: number;      // % change vs previous period
  totalLeads?: number;
  leadsChange?: number;              // % change vs previous period
  conversionRate?: number;

  // Conversation data
  conversationStats?: Array<{ 
    date: string; 
    total: number; 
    active: number; 
    closed: number;
  }>;
  conversationFunnel?: Array<{ 
    name: string; 
    count: number; 
    percentage: number; 
    dropOffPercent: number;
  }>;
  peakActivity?: { 
    peakDay: string; 
    peakTime: string; 
    peakValue: number;
  };

  // Lead data
  leadStats?: Array<{ 
    date: string; 
    total: number;
  }>;
  leadSourceBreakdown?: Array<{ 
    source: string; 
    leads: number; 
    sessions: number; 
    cvr: number;
  }>;

  // Booking data
  bookingStats?: Array<{ 
    location: string; 
    total: number; 
    confirmed: number; 
    completed: number; 
    no_show: number; 
    show_rate: number;
  }>;
  bookingTrend?: Array<{ 
    date: string; 
    confirmed: number; 
    completed: number; 
    cancelled: number; 
    noShow: number;
  }>;

  // Satisfaction data
  satisfactionStats?: { 
    average_rating: number; 
    total_ratings: number; 
    distribution?: Array<{ 
      rating: number; 
      count: number;
    }>;
  };
  recentFeedback?: Array<{ 
    rating: number; 
    feedback: string | null; 
    createdAt: string; 
    triggerType: string;
  }>;

  // AI performance
  aiPerformanceStats?: { 
    containment_rate: number; 
    resolution_rate: number; 
    ai_handled: number; 
    human_takeover: number; 
    total_conversations: number;
  };

  // Traffic data
  trafficSources?: Array<{ 
    source: string; 
    visitors: number; 
    percentage: number;
  }>;
  trafficSourceTrend?: Array<{ 
    date: string; 
    direct: number; 
    organic: number; 
    paid: number; 
    social: number; 
    email: number; 
    referral: number;
  }>;

  // Page analytics
  topPages?: Array<{ 
    page: string; 
    visits: number; 
    bounce_rate: number; 
    conversations: number;
  }>;
  pageEngagement?: { 
    bounceRate: number; 
    avgPagesPerSession: number; 
    totalSessions: number; 
    overallCVR: number;
  };
  pageDepthDistribution?: Array<{ 
    depth: string; 
    count: number; 
    percentage: number;
  }>;

  // Geographic data
  visitorLocations?: Array<{ 
    country: string; 
    visitors: number; 
    percentage: number;
  }>;
}
```

### PDFConfig

Controls which sections appear in the report:

```typescript
interface PDFConfig {
  // Global toggles
  includeKPIs?: boolean;           // KPI summary cards
  includeCharts?: boolean;         // Chart visualizations
  includeTables?: boolean;         // Data tables
  type?: ReportType;               // Report detail level

  // Conversation section
  includeConversations?: boolean;
  includeConversationFunnel?: boolean;
  includePeakActivity?: boolean;

  // Lead section
  includeLeads?: boolean;
  includeLeadSourceBreakdown?: boolean;
  includeLeadConversionTrend?: boolean;

  // Booking section
  includeBookings?: boolean;
  includeBookingTrend?: boolean;

  // Satisfaction section
  includeSatisfaction?: boolean;
  includeCustomerFeedback?: boolean;

  // AI section
  includeAIPerformance?: boolean;

  // Traffic section
  includeTrafficSources?: boolean;
  includeTrafficSourceTrend?: boolean;

  // Page analytics section
  includeTopPages?: boolean;
  includePageEngagement?: boolean;
  includePageDepth?: boolean;

  // Geographic section
  includeVisitorLocations?: boolean;
}
```

---

## Key Components

### AnalyticsReportPDF

Main document component that renders the full PDF report.

```typescript
interface AnalyticsReportPDFProps {
  data: PDFData;          // All analytics data
  config: PDFConfig;      // Which sections/charts to include
  startDate: Date;        // Report date range start
  endDate: Date;          // Report date range end
  orgName: string;        // Organization name for header
}
```

### PDFKPICards

Displays key performance indicators in a responsive card grid.

```typescript
interface KPIData {
  label: string;                    // Card label
  value: string | number;           // Display value
  change?: number | null;           // % change (colored +green/-red)
  suffix?: string;                  // Optional suffix (e.g., '%')
}

interface PDFKPICardsProps {
  kpis: KPIData[];                  // Array of KPI items
}
```

### PDFTable

Renders data tables with proper styling and alternating row colors.

```typescript
interface ColumnDef {
  key: string;                      // Data key
  header: string;                   // Column header text
  width?: number | string;          // Fixed width (optional)
  align?: 'left' | 'center' | 'right';
}

interface PDFTableProps {
  columns: ColumnDef[];             // Column definitions
  data: Record<string, string | number | null | undefined>[];
  maxRows?: number;                 // Default: 15
}
```

---

## Chart Components

All charts use native SVG primitives from `@react-pdf/renderer`.

### PDFLineChart

Multi-series line charts with automatic scaling.

```typescript
interface DataPoint {
  date: string;
  [key: string]: number | string;   // Dynamic value keys
}

interface Series {
  key: string;                      // Data key for this series
  color: string;                    // Line color
  label?: string;                   // Legend label
}

interface PDFLineChartProps {
  data: DataPoint[];
  series: Series[];
  width?: number;                   // Default: CHART_DIMS.width (515)
  height?: number;                  // Default: CHART_DIMS.height (180)
  maxPoints?: number;               // Default: 30 (downsamples if exceeded)
}
```

**Features:**
- Automatic Y-axis scaling with nice tick values
- Data downsampling for readability
- Legend for multiple series
- Grid lines and axis labels

### PDFSimpleLineChart

Convenience wrapper for single-series line charts.

```typescript
interface PDFSimpleLineChartProps {
  data: Array<{ date: string; [key: string]: number | string }>;
  valueKey: string;                 // Which key holds the value
  color?: string;                   // Default: CHART_COLORS.primary
  width?: number;
  height?: number;
}
```

### PDFBarChart

Vertical bar chart with single data series.

```typescript
interface DataPoint {
  label: string;
  value: number;
}

interface PDFBarChartProps {
  data: DataPoint[];
  valueKey?: string;                // Default: 'value'
  color?: string;                   // Default: CHART_COLORS.primary
  width?: number;
  height?: number;
}
```

### PDFGroupedBarChart

Grouped vertical bars for comparing multiple series.

```typescript
interface GroupedBarChartProps {
  data: Array<{ label: string; [key: string]: number | string }>;
  series: Array<{ key: string; color: string; label?: string }>;
  width?: number;
  height?: number;
}
```

**Features:**
- Multiple bars per category
- Legend for series identification
- Automatic bar width calculation

### PDFHorizontalBarChart

Horizontal bars for ranked/comparison data.

```typescript
interface PDFHorizontalBarChartProps {
  data: Array<{ label: string; value: number }>;
  color?: string;
  width?: number;
  height?: number;
}
```

### PDFPieChart

Pie and donut charts with legends.

```typescript
interface DataPoint {
  label: string;
  value: number;
  color?: string;                   // Optional custom color
}

interface PDFPieChartProps {
  data: DataPoint[];
  donut?: boolean;                  // Default: false
  showLegend?: boolean;             // Default: true
  centerLabel?: string;             // For donut: center text label
  width?: number;
  height?: number;
}
```

**Features:**
- Pie or donut mode
- Automatic legend generation
- Center total display for donut charts
- Custom segment colors

### PDFTrafficSourceChart

Convenience wrapper for traffic source donut charts.

```typescript
interface TrafficSourceData {
  source: string;
  visitors: number;
  percentage: number;
}

interface PDFTrafficSourceChartProps {
  data: TrafficSourceData[];
  width?: number;
  height?: number;
}
```

### PDFStackedBarChart

Stacked bar charts for trend visualization.

```typescript
interface DataPoint {
  date: string;
  [key: string]: number | string;   // Dynamic series values
}

interface Series {
  key: string;
  color: string;
  label?: string;
}

interface PDFStackedBarChartProps {
  data: DataPoint[];
  series: Series[];
  width?: number;
  height?: number;
  maxPoints?: number;               // Default: 30
}
```

### PDFBookingTrendChart

Pre-configured stacked bar chart for booking trends.

```typescript
interface BookingTrendData {
  date: string;
  confirmed: number;
  completed: number;
  cancelled: number;
  noShow: number;
}

interface PDFBookingTrendChartProps {
  data: BookingTrendData[];
  width?: number;
  height?: number;
}
```

### PDFTrafficTrendChart

Pre-configured stacked bar chart for traffic source trends.

```typescript
interface TrafficTrendData {
  date: string;
  direct: number;
  organic: number;
  paid: number;
  social: number;
  email: number;
  referral: number;
}

interface PDFTrafficTrendChartProps {
  data: TrafficTrendData[];
  width?: number;
  height?: number;
}
```

---

## Design System

### Brand Colors (`styles.ts`)

```typescript
export const colors = {
  // Primary text & backgrounds
  primary: '#0f172a',       // slate-900
  secondary: '#475569',     // slate-600
  muted: '#94a3b8',         // slate-400
  
  // Accent colors
  accent: '#2563eb',        // blue-600 (brand primary)
  success: '#16a34a',       // green-600
  warning: '#eab308',       // yellow-500
  danger: '#dc2626',        // red-600
  
  // Backgrounds
  bg: '#f8fafc',            // slate-50
  bgAlt: '#f1f5f9',         // slate-100
  white: '#ffffff',
  
  // Header
  headerBg: '#0f172a',      // slate-900
  headerText: '#ffffff',
  headerSubtext: '#94a3b8', // slate-400
};
```

### Chart Colors (`pdf-chart-utils.ts`)

```typescript
export const CHART_COLORS = {
  primary: '#2563eb',    // blue-600
  secondary: '#64748b',  // slate-500
  success: '#16a34a',    // green-600
  warning: '#eab308',    // yellow-500
  danger: '#dc2626',     // red-600
  purple: '#9333ea',     // purple-600
  teal: '#14b8a6',       // teal-500
  orange: '#f97316',     // orange-500
  pink: '#ec4899',       // pink-500
  indigo: '#6366f1',     // indigo-500
} as const;

// Array form for multi-series charts (auto-assign colors)
export const CHART_COLOR_ARRAY = [
  CHART_COLORS.primary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.purple,
  CHART_COLORS.teal,
  CHART_COLORS.orange,
  CHART_COLORS.pink,
  CHART_COLORS.danger,
  CHART_COLORS.indigo,
  CHART_COLORS.secondary,
];
```

### Chart Dimensions

```typescript
export const CHART_DIMS = {
  width: 515,      // PAGE.CONTENT_WIDTH (A4 minus margins)
  height: 180,
  padding: { top: 20, right: 20, bottom: 30, left: 50 },
} as const;

export type ChartPadding = typeof CHART_DIMS.padding;
```

### Page Dimensions

```typescript
export const PAGE = {
  WIDTH: 595.28,          // A4 width in points
  HEIGHT: 841.89,         // A4 height in points
  MARGIN: 40,
  CONTENT_WIDTH: 515.28,  // 595.28 - 40*2
} as const;
```

### Spacing & Typography

```typescript
export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 24,
  XXL: 32,
};

export const FONT_SIZE = {
  XS: 8,
  SM: 9,
  BASE: 10,
  MD: 11,
  LG: 14,
  XL: 18,
  XXL: 22,
  XXXL: 28,
};
```

---

## Utility Functions

### Scaling Functions

```typescript
// Linear scale: maps domain [d0, d1] → range [r0, r1]
function scaleLinear(
  domain: [number, number],
  range: [number, number]
): (value: number) => number;

// Band scale: maps categorical data → evenly-spaced positions
function scaleBand(
  domain: string[],
  range: [number, number],
  padding?: number  // Default: 0.1
): { 
  scale: (key: string) => number; 
  bandwidth: number; 
};
```

### Tick Generation

```typescript
// Generate nice tick values for an axis
function generateTicks(
  min: number, 
  max: number, 
  targetCount?: number  // Default: 5
): number[];
```

### Formatting Functions

```typescript
// Format numbers for axis labels (1000 → 1K, 1000000 → 1M)
function formatAxisValue(value: number): string;

// Format percentage with decimal control
function formatPercent(value: number, decimals?: number): string;
// formatPercent(45.678) → "45.7%"
// formatPercent(45.678, 2) → "45.68%"

// Format date for chart labels
function formatDateLabel(dateStr: string, short?: boolean): string;
// formatDateLabel("2024-03-15") → "Mar 15"
// formatDateLabel("2024-03-15", false) → "Mar 15, 2024"
```

### Path Building

```typescript
// Build SVG path for line charts
function buildLinePath(
  points: Array<{ x: number; y: number }>
): string;

// Build SVG arc path for pie chart segments
function buildArcPath(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string;
```

### Data Processing

```typescript
// Downsample data for readability
function downsampleData<T>(
  data: T[], 
  maxPoints?: number  // Default: 30
): T[];
```

---

## Font Handling

Fonts are registered in `fonts.ts`:

```typescript
const INTER_FONTS = {
  regular: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.8/files/inter-latin-400-normal.woff',
  medium: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.8/files/inter-latin-500-normal.woff',
  semibold: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.8/files/inter-latin-600-normal.woff',
  bold: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.8/files/inter-latin-700-normal.woff',
};
```

- **Primary font:** Inter (4 weights: 400, 500, 600, 700)
- **CDN:** jsDelivr (stable, versioned)
- **Fallback:** Helvetica (system font) if CDN fails
- **Auto-registration:** Fonts register on module import

---

## Public Exports

### From `src/lib/pdf-components/index.ts`

```typescript
// Components
export { AnalyticsReportPDF } from './AnalyticsReportPDF';
export { PDFHeader } from './PDFHeader';
export { PDFFooter } from './PDFFooter';
export { PDFKPICards } from './PDFKPICards';
export { PDFTable } from './PDFTable';
export { PDFSection } from './PDFSection';

// Types
export type { PDFData, PDFConfig } from './AnalyticsReportPDF';

// Design system
export { styles, colors, PAGE, SPACING, FONT_SIZE, tableStyles } from './styles';
export { registerFonts } from './fonts';

// Charts (re-exported from ./charts)
export * from './charts';
```

### From `src/lib/pdf-components/charts/index.ts`

```typescript
// Line charts
export { PDFLineChart, PDFSimpleLineChart } from './PDFLineChart';

// Bar charts
export { PDFBarChart, PDFGroupedBarChart, PDFHorizontalBarChart } from './PDFBarChart';

// Pie/Donut charts
export { PDFPieChart, PDFTrafficSourceChart } from './PDFPieChart';

// Stacked bar charts
export { PDFStackedBarChart, PDFBookingTrendChart, PDFTrafficTrendChart } from './PDFStackedBarChart';

// Utilities & constants
export { 
  CHART_COLORS, 
  CHART_COLOR_ARRAY, 
  CHART_DIMS,
  formatAxisValue,
  formatDateLabel,
  formatPercent,
} from './pdf-chart-utils';
```

---

## Adding New Charts

1. Create component in `src/lib/pdf-components/charts/`
2. Use `scaleLinear` or `scaleBand` for axis scaling
3. Use `generateTicks` for Y-axis tick values
4. Import colors from design system
5. Add empty state component with "No data available" message
6. Export from `charts/index.ts`

Example skeleton:

```tsx
import { View, Svg, G, Rect, Text } from '@react-pdf/renderer';
import { scaleLinear, CHART_DIMS, CHART_COLORS } from './pdf-chart-utils';
import { colors } from '../styles';

interface PDFNewChartProps {
  data: Array<{ label: string; value: number }>;
  width?: number;
  height?: number;
}

export function PDFNewChart({ 
  data, 
  width = CHART_DIMS.width,
  height = CHART_DIMS.height 
}: PDFNewChartProps) {
  if (!data?.length) {
    return <PDFNewChartEmpty width={width} />;
  }
  
  // Calculate scales, render SVG primitives
  return (
    <View style={{ width }}>
      <Svg width={width} height={height}>
        {/* Chart content */}
      </Svg>
    </View>
  );
}

function PDFNewChartEmpty({ width }: { width: number }) {
  return (
    <View style={{ 
      width, 
      height: 60, 
      backgroundColor: colors.bg, 
      borderRadius: 4, 
      justifyContent: 'center', 
      alignItems: 'center' 
    }}>
      <Text style={{ fontSize: 9, color: colors.muted }}>
        No data available
      </Text>
    </View>
  );
}
```

---

## Multi-Page Support

The report uses `@react-pdf/renderer`'s automatic pagination:

- `<Page wrap>` enables content wrapping across pages
- `<View wrap>` on content container allows splitting
- `<PDFSection break>` can force page breaks before sections

---

## Error Handling

Charts handle errors gracefully:
- **Empty data** → "No data available" placeholder
- **Invalid data** → Charts validate data at render time
- **Font failures** → Fallback to Helvetica system font

**Note:** React rendering errors cannot be caught with try-catch. Error boundaries don't work in `@react-pdf/renderer`. Charts must validate data before rendering.

---

## Testing

Test PDF generation with various data states:
- Empty arrays
- Single data point
- Large datasets (>100 points)
- Missing optional fields
- Edge values (0, negative, very large)

---

## Troubleshooting

### Charts not rendering
- Check data format matches expected interface
- Verify series keys exist in data points
- Check for NaN or undefined values

### Fonts look wrong
- Check browser console for font loading errors
- Verify CDN is accessible
- Clear browser cache

### Page overflow
- Add `break` prop to sections that should start new pages
- Use `minPresenceAhead` for section headers
- Check that tables aren't too wide

### Colors look off
- Ensure using colors from design system, not hex literals
- Check for transparency issues in PDF viewers
