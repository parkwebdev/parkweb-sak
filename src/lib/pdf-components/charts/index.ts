/**
 * PDF Charts Index
 * 
 * Native @react-pdf/renderer chart components.
 * These render directly from data - no DOM/SVG scraping needed.
 */

export { PDFLineChart, PDFSimpleLineChart } from './PDFLineChart';
export { PDFBarChart, PDFGroupedBarChart, PDFHorizontalBarChart } from './PDFBarChart';
export { PDFPieChart, PDFTrafficSourceChart } from './PDFPieChart';
export { PDFStackedBarChart, PDFBookingTrendChart, PDFTrafficTrendChart } from './PDFStackedBarChart';
export { 
  CHART_COLORS, 
  CHART_COLOR_ARRAY, 
  CHART_DIMS,
  formatAxisValue,
  formatDateLabel,
  formatPercent,
} from './pdf-chart-utils';
