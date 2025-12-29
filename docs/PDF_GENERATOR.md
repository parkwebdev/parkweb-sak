# PDF Generator Architecture

## Overview

The PDF generator creates analytics reports using `@react-pdf/renderer` with native vector chart components. This provides crisp, scalable graphics that render identically across all PDF viewers.

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

## Key Components

### AnalyticsReportPDF

Main document component that accepts:

```typescript
interface AnalyticsReportPDFProps {
  data: PDFData;          // All analytics data
  config: PDFConfig;      // Which sections/charts to include
  startDate: Date;        // Report date range
  endDate: Date;
  orgName: string;        // Organization name for header
}
```

### PDFConfig

Controls which sections appear in the report:

```typescript
interface PDFConfig {
  includeKPIs?: boolean;
  includeCharts?: boolean;
  includeTables?: boolean;
  includeConversations?: boolean;
  includeLeads?: boolean;
  includeBookings?: boolean;
  // ... more section flags
}
```

## Chart Components

All charts use native SVG primitives from `@react-pdf/renderer`:

### PDFLineChart
- Multi-series line charts
- Automatic Y-axis scaling
- Data downsampling for readability
- Legend for multiple series

### PDFBarChart
- Vertical bars with labels
- `PDFGroupedBarChart` for multi-series
- `PDFHorizontalBarChart` for ranked data

### PDFPieChart
- Standard pie or donut mode
- Automatic legend generation
- Center total for donut charts

### PDFStackedBarChart
- Stacked segments by category
- Convenience wrappers: `PDFBookingTrendChart`, `PDFTrafficTrendChart`

## Design System

Charts use colors from `src/lib/pdf-components/styles.ts`:

```typescript
export const colors = {
  primary: '#0f172a',     // Text
  secondary: '#475569',   // Labels
  muted: '#94a3b8',       // Subdued text
  accent: '#2563eb',      // Brand blue
  success: '#16a34a',     // Positive
  warning: '#eab308',     // Warning
  danger: '#dc2626',      // Negative
  bg: '#f8fafc',          // Light background
  bgAlt: '#f1f5f9',       // Grid lines
  white: '#ffffff',       // Backgrounds
};
```

Chart-specific colors in `pdf-chart-utils.ts`:

```typescript
export const CHART_COLORS = {
  primary: '#2563eb',
  secondary: '#64748b',
  success: '#16a34a',
  warning: '#eab308',
  danger: '#dc2626',
  purple: '#9333ea',
  teal: '#14b8a6',
  // ...
};
```

## Adding New Charts

1. Create component in `src/lib/pdf-components/charts/`
2. Use `scaleLinear` or `scaleBand` for axis scaling
3. Use `generateTicks` for Y-axis tick values
4. Import colors from `../styles`
5. Add empty state component with "No data available" message
6. Export from `charts/index.ts`

Example skeleton:

```tsx
import { View, Svg, G, Rect, Text } from '@react-pdf/renderer';
import { scaleLinear, CHART_DIMS } from './pdf-chart-utils';
import { colors } from '../styles';

export function PDFNewChart({ data, width = CHART_DIMS.width }) {
  if (!data?.length) {
    return <PDFNewChartEmpty width={width} />;
  }
  
  // Calculate scales, render SVG primitives
  return (
    <View style={{ width }}>
      <Svg width={width} height={CHART_DIMS.height}>
        {/* Chart content */}
      </Svg>
    </View>
  );
}

function PDFNewChartEmpty({ width }) {
  return (
    <View style={{ width, height: 60, backgroundColor: colors.bg, borderRadius: 4, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 9, color: colors.muted }}>No data available</Text>
    </View>
  );
}
```

## Multi-Page Support

The report uses `@react-pdf/renderer`'s automatic pagination:

- `<Page wrap>` enables content wrapping across pages
- `<View wrap>` on content container allows splitting
- `<PDFSection break>` can force page breaks before sections

## Font Handling

Fonts are registered in `fonts.ts`:
- Primary: Inter from jsDelivr CDN
- Fallback: Helvetica (system font) if CDN fails

## Error Handling

Charts handle errors gracefully:
- Empty data → "No data available" placeholder
- Render errors → Caught by `renderChartSafe()` wrapper
- Font failures → Fallback to Helvetica

## Testing

Test PDF generation with various data states:
- Empty arrays
- Single data point
- Large datasets (>100 points)
- Missing optional fields
- Edge values (0, negative, very large)

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
