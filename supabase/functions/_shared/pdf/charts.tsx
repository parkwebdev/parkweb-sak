/**
 * PDF Charts Index for Edge Functions
 * Simplified chart components for server-side rendering
 */

// @ts-ignore
import React from 'npm:react@18.3.1';
// @ts-ignore
import { View, Text, Svg, G, Path, Line, Rect, Text as SvgText, StyleSheet } from 'npm:@react-pdf/renderer@4.3.0';
import { colors } from './styles.ts';
import { scaleLinear, scaleBand, generateTicks, formatAxisValue, formatDateLabel, buildLinePath, buildArcPath, downsampleData, CHART_COLORS, CHART_COLOR_ARRAY, CHART_DIMS } from './chart-utils.ts';

const chartStyles = StyleSheet.create({
  axisLabel: { fontSize: 8 },
  axisLabelSmall: { fontSize: 7 },
  legendLabel: { fontSize: 7 },
  emptyContainer: { height: 60, backgroundColor: colors.bgAlt, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 9, color: colors.muted },
});

// Empty chart placeholder
function ChartEmpty({ width }: { width: number }) {
  return React.createElement(View, { style: { ...chartStyles.emptyContainer, width } },
    React.createElement(Text, { style: chartStyles.emptyText }, 'No data available')
  );
}

// LINE CHART
interface LineChartProps {
  data: Array<{ date: string; [key: string]: string | number }>;
  series: Array<{ key: string; color: string; label?: string }>;
  width?: number;
  height?: number;
  maxPoints?: number;
}

export function PDFLineChart({ data, series, width = CHART_DIMS.width, height = CHART_DIMS.height, maxPoints = 30 }: LineChartProps) {
  if (!data?.length || !series?.length) return React.createElement(ChartEmpty, { width });

  const sampledData = downsampleData(data, maxPoints);
  const { padding } = CHART_DIMS;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  let minY = Infinity, maxY = -Infinity;
  for (const d of sampledData) {
    for (const s of series) {
      const val = Number(d[s.key]) || 0;
      if (val < minY) minY = val;
      if (val > maxY) maxY = val;
    }
  }
  if (minY === maxY) { minY = 0; maxY = maxY || 1; }
  if (minY > 0) minY = 0;

  const yTicks = generateTicks(minY, maxY, 5);
  const yScale = scaleLinear([yTicks[0], yTicks[yTicks.length - 1]], [plotHeight, 0]);
  const xStep = plotWidth / (sampledData.length - 1 || 1);

  const paths = series.map(s => {
    const points = sampledData.map((d, i) => ({ x: padding.left + i * xStep, y: padding.top + yScale(Number(d[s.key]) || 0) }));
    return { ...s, path: buildLinePath(points) };
  });

  const xLabelStep = Math.max(1, Math.floor(sampledData.length / 6));
  const xLabels = sampledData.filter((_, i) => i % xLabelStep === 0 || i === sampledData.length - 1).map((d) => ({ label: formatDateLabel(d.date), x: padding.left + sampledData.indexOf(d) * xStep }));

  return React.createElement(View, { style: { width, height, marginBottom: 8 }, wrap: false },
    React.createElement(Svg, { width, height },
      React.createElement(Rect, { x: 0, y: 0, width, height, fill: colors.white }),
      React.createElement(G, null, yTicks.map((tick, i) => {
        const y = padding.top + yScale(tick);
        return React.createElement(G, { key: `y-${i}` },
          React.createElement(Line, { x1: padding.left, y1: y, x2: width - padding.right, y2: y, stroke: colors.bgMuted, strokeWidth: 1 }),
          React.createElement(SvgText, { x: padding.left - 8, y: y + 3, fill: colors.secondary, style: chartStyles.axisLabel, textAnchor: 'end' }, formatAxisValue(tick))
        );
      })),
      React.createElement(G, null, xLabels.map((item, i) => React.createElement(SvgText, { key: `x-${i}`, x: item.x, y: height - 8, fill: colors.secondary, style: chartStyles.axisLabelSmall, textAnchor: 'middle' }, item.label))),
      React.createElement(G, null, paths.map((p, i) => React.createElement(Path, { key: `line-${i}`, d: p.path, stroke: p.color, strokeWidth: 2, fill: 'none' }))),
      series.length > 1 && React.createElement(G, null, series.map((s, i) => React.createElement(G, { key: `legend-${i}` },
        React.createElement(Rect, { x: padding.left + i * 80, y: 4, width: 10, height: 10, fill: s.color, rx: 2 }),
        React.createElement(SvgText, { x: padding.left + i * 80 + 14, y: 12, fill: colors.secondary, style: chartStyles.legendLabel }, s.label || s.key)
      )))
    )
  );
}

// BAR CHART
interface BarChartProps {
  data: Array<{ label: string; [key: string]: string | number }>;
  valueKey: string;
  color?: string;
  width?: number;
  height?: number;
}

export function PDFBarChart({ data, valueKey, color = CHART_COLORS.primary, width = CHART_DIMS.width, height = CHART_DIMS.height }: BarChartProps) {
  if (!data?.length) return React.createElement(ChartEmpty, { width });

  const { padding } = CHART_DIMS;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const values = data.map(d => Number(d[valueKey]) || 0);
  const maxY = Math.max(...values, 1);
  const yTicks = generateTicks(0, maxY, 5);
  const yScale = scaleLinear([0, yTicks[yTicks.length - 1]], [plotHeight, 0]);
  const labels = data.map(d => String(d.label));
  const { scale: xScale, bandwidth } = scaleBand(labels, [0, plotWidth], 8);

  return React.createElement(View, { style: { width, height, marginBottom: 8 }, wrap: false },
    React.createElement(Svg, { width, height },
      React.createElement(Rect, { x: 0, y: 0, width, height, fill: colors.white }),
      React.createElement(G, null, yTicks.map((tick, i) => {
        const y = padding.top + yScale(tick);
        return React.createElement(G, { key: `y-${i}` },
          React.createElement(Line, { x1: padding.left, y1: y, x2: width - padding.right, y2: y, stroke: colors.bgMuted, strokeWidth: 1 }),
          React.createElement(SvgText, { x: padding.left - 8, y: y + 3, fill: colors.secondary, style: chartStyles.axisLabel, textAnchor: 'end' }, formatAxisValue(tick))
        );
      })),
      React.createElement(G, null, data.map((d, i) => {
        const value = Number(d[valueKey]) || 0;
        const barHeight = plotHeight - yScale(value);
        const x = padding.left + xScale(String(d.label));
        const y = padding.top + yScale(value);
        return React.createElement(Rect, { key: `bar-${i}`, x, y, width: bandwidth, height: barHeight, fill: color, rx: 3 });
      })),
      React.createElement(G, null, data.map((d, i) => {
        const label = String(d.label);
        const x = padding.left + xScale(label) + bandwidth / 2;
        const displayLabel = label.length > 12 ? label.slice(0, 10) + '…' : label;
        return React.createElement(SvgText, { key: `x-${i}`, x, y: height - 8, fill: colors.secondary, style: chartStyles.axisLabelSmall, textAnchor: 'middle' }, displayLabel);
      }))
    )
  );
}

// HORIZONTAL BAR CHART
export function PDFHorizontalBarChart({ data, valueKey, color = CHART_COLORS.primary, width = CHART_DIMS.width, height }: BarChartProps & { height?: number }) {
  if (!data?.length) return React.createElement(ChartEmpty, { width });

  const chartHeight = height || Math.max(80, data.length * 28);
  const padding = { top: 10, right: 40, bottom: 10, left: 100 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const values = data.map(d => Number(d[valueKey]) || 0);
  const maxX = Math.max(...values, 1);
  const xScale = scaleLinear([0, maxX], [0, plotWidth]);
  const labels = data.map(d => String(d.label));
  const { scale: yScale, bandwidth } = scaleBand(labels, [0, plotHeight], 4);

  return React.createElement(View, { style: { width, height: chartHeight, marginBottom: 8 }, wrap: false },
    React.createElement(Svg, { width, height: chartHeight },
      React.createElement(Rect, { x: 0, y: 0, width, height: chartHeight, fill: colors.white }),
      React.createElement(G, null, data.map((d, i) => {
        const value = Number(d[valueKey]) || 0;
        const barWidth = xScale(value);
        const label = String(d.label);
        const y = padding.top + yScale(label);
        const displayLabel = label.length > 15 ? label.slice(0, 13) + '…' : label;
        return React.createElement(G, { key: `bar-${i}` },
          React.createElement(SvgText, { x: padding.left - 8, y: y + bandwidth / 2 + 3, fill: colors.secondary, style: chartStyles.axisLabel, textAnchor: 'end' }, displayLabel),
          React.createElement(Rect, { x: padding.left, y, width: barWidth, height: bandwidth, fill: color, rx: 3 }),
          React.createElement(SvgText, { x: padding.left + barWidth + 6, y: y + bandwidth / 2 + 3, fill: colors.secondary, style: chartStyles.axisLabel }, formatAxisValue(value))
        );
      }))
    )
  );
}

// PIE CHART
interface PieChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  width?: number;
  height?: number;
  donut?: boolean;
  showLegend?: boolean;
}

export function PDFPieChart({ data, width = 200, height = 160, showLegend = true, donut = false }: PieChartProps) {
  if (!data?.length) return React.createElement(ChartEmpty, { width });

  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);
  if (total === 0) return React.createElement(ChartEmpty, { width });

  const cx = width / 2 - (showLegend ? 40 : 0);
  const cy = height / 2;
  const radius = Math.min(cx, cy) - 20;
  const innerRadius = donut ? radius * 0.5 : 0;

  let currentAngle = -Math.PI / 2;
  const segments = data.map((d, i) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;
    return { ...d, percentage: (d.value / total) * 100, startAngle, endAngle, color: d.color || CHART_COLOR_ARRAY[i % CHART_COLOR_ARRAY.length], path: buildArcPath(cx, cy, radius, startAngle, endAngle) };
  });

  return React.createElement(View, { style: { width, height, marginBottom: 8 }, wrap: false },
    React.createElement(Svg, { width, height },
      React.createElement(G, null, segments.map((seg, i) => React.createElement(Path, { key: `segment-${i}`, d: seg.path, fill: seg.color }))),
      donut && React.createElement(G, null, React.createElement(Path, { d: `M ${cx} ${cy} m ${-innerRadius} 0 a ${innerRadius} ${innerRadius} 0 1 0 ${innerRadius * 2} 0 a ${innerRadius} ${innerRadius} 0 1 0 ${-innerRadius * 2} 0`, fill: colors.white })),
      showLegend && React.createElement(G, null, segments.slice(0, 6).map((seg, i) => {
        const legendX = width - 80;
        const legendY = 20 + i * 18;
        const displayLabel = seg.label.length > 10 ? seg.label.slice(0, 8) + '…' : seg.label;
        return React.createElement(G, { key: `legend-${i}` },
          React.createElement(Path, { d: `M ${legendX} ${legendY} h 10 v 10 h -10 z`, fill: seg.color }),
          React.createElement(SvgText, { x: legendX + 14, y: legendY + 8, fill: colors.secondary, style: chartStyles.legendLabel }, displayLabel),
          React.createElement(SvgText, { x: legendX + 14, y: legendY + 16, fill: colors.muted, style: { fontSize: 6 } }, `${seg.percentage.toFixed(1)}%`)
        );
      })),
      donut && React.createElement(G, null,
        React.createElement(SvgText, { x: cx, y: cy - 4, fill: colors.primary, style: { fontSize: 14, fontWeight: 700 }, textAnchor: 'middle' }, total.toLocaleString()),
        React.createElement(SvgText, { x: cx, y: cy + 10, fill: colors.secondary, style: { fontSize: 8 }, textAnchor: 'middle' }, 'Total')
      )
    )
  );
}

// Convenience charts
export function PDFBookingTrendChart({ data, width = CHART_DIMS.width, height = CHART_DIMS.height }: { data: Array<{ date: string; confirmed: number; completed: number; cancelled: number; noShow: number }>; width?: number; height?: number }) {
  return React.createElement(PDFLineChart, { data, series: [{ key: 'completed', color: CHART_COLORS.success, label: 'Completed' }, { key: 'confirmed', color: CHART_COLORS.primary, label: 'Confirmed' }], width, height });
}

export function PDFTrafficTrendChart({ data, width = CHART_DIMS.width, height = CHART_DIMS.height }: { data: Array<{ date: string; direct: number; organic: number; paid: number; social: number; email: number; referral: number }>; width?: number; height?: number }) {
  return React.createElement(PDFLineChart, { data, series: [{ key: 'direct', color: CHART_COLORS.primary, label: 'Direct' }, { key: 'organic', color: CHART_COLORS.success, label: 'Organic' }], width, height });
}

export { CHART_COLORS };
