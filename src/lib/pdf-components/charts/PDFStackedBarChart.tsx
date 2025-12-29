/**
 * PDF Stacked Bar Chart
 * 
 * Native @react-pdf/renderer stacked bar chart for trends.
 */

import { View, Svg, G, Rect, Line, Text as SvgText, StyleSheet, Text } from '@react-pdf/renderer';
import { 
  scaleLinear, 
  scaleBand,
  generateTicks, 
  formatAxisValue,
  formatDateLabel,
  downsampleData,
  CHART_DIMS,
  CHART_COLORS,
} from './pdf-chart-utils';
import { colors } from '../styles';

const chartStyles = StyleSheet.create({
  axisLabel: { fontSize: 8 },
  axisLabelSmall: { fontSize: 7 },
  legendLabel: { fontSize: 7 },
});

interface DataPoint {
  date: string;
  [key: string]: string | number;
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
  maxPoints?: number;
}

export function PDFStackedBarChart({
  data,
  series,
  width = CHART_DIMS.width,
  height = CHART_DIMS.height,
  maxPoints = 20,
}: PDFStackedBarChartProps) {
  if (!data?.length || !series?.length) {
    return <PDFStackedBarChartEmpty width={width} height={height} />;
  }

  const sampledData = downsampleData(data, maxPoints);
  const { padding } = CHART_DIMS;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Calculate max stacked value
  let maxY = 0;
  for (const d of sampledData) {
    let stackedValue = 0;
    for (const s of series) {
      stackedValue += Number(d[s.key]) || 0;
    }
    if (stackedValue > maxY) maxY = stackedValue;
  }
  maxY = maxY || 1;

  const yTicks = generateTicks(0, maxY, 5);
  const yScale = scaleLinear([0, yTicks[yTicks.length - 1]], [plotHeight, 0]);

  // X scale
  const labels = sampledData.map(d => d.date);
  const { scale: xScale, bandwidth } = scaleBand(labels, [0, plotWidth], 2);

  // X-axis labels (show subset)
  const xLabelStep = Math.max(1, Math.floor(sampledData.length / 6));
  const xLabels = sampledData
    .filter((_, i) => i % xLabelStep === 0 || i === sampledData.length - 1)
    .map(d => ({
      label: formatDateLabel(d.date),
      x: padding.left + xScale(d.date) + bandwidth / 2,
    }));

  return (
    <View style={{ width, height, marginBottom: 8 }}>
      <Svg width={width} height={height}>
        <Rect x={0} y={0} width={width} height={height} fill={colors.white} />

        {/* Y-axis grid */}
        <G>
          {yTicks.map((tick, i) => {
            const y = padding.top + yScale(tick);
            return (
              <G key={`y-${i}`}>
                <Line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke={colors.bgAlt}
                  strokeWidth={1}
                />
                <SvgText
                  x={padding.left - 8}
                  y={y + 3}
                  fill={colors.secondary}
                  style={chartStyles.axisLabel}
                  textAnchor="end"
                >
                  {formatAxisValue(tick)}
                </SvgText>
              </G>
            );
          })}
        </G>

        {/* Stacked bars */}
        <G>
          {sampledData.map((d, di) => {
            const x = padding.left + xScale(d.date);
            let currentY = plotHeight; // Start from bottom

            return (
              <G key={`stack-${di}`}>
                {series.map((s, si) => {
                  const value = Number(d[s.key]) || 0;
                  const barHeight = plotHeight - yScale(value);
                  const y = padding.top + currentY - barHeight;
                  currentY -= barHeight;

                  return (
                    <Rect
                      key={`bar-${di}-${si}`}
                      x={x}
                      y={y}
                      width={bandwidth}
                      height={barHeight}
                      fill={s.color}
                    />
                  );
                })}
              </G>
            );
          })}
        </G>

        {/* X-axis labels */}
        <G>
          {xLabels.map((item, i) => (
            <SvgText
              key={`x-${i}`}
              x={item.x}
              y={height - 8}
              fill={colors.secondary}
              style={chartStyles.axisLabelSmall}
              textAnchor="middle"
            >
              {item.label}
            </SvgText>
          ))}
        </G>

        {/* Legend */}
        <G>
          {series.map((s, i) => (
            <G key={`legend-${i}`}>
              <Rect
                x={padding.left + i * 70}
                y={4}
                width={10}
                height={10}
                fill={s.color}
                rx={1}
              />
              <SvgText
                x={padding.left + i * 70 + 14}
                y={12}
                fill={colors.secondary}
                style={chartStyles.legendLabel}
              >
                {s.label || s.key}
              </SvgText>
            </G>
          ))}
        </G>
      </Svg>
    </View>
  );
}

function PDFStackedBarChartEmpty({ width }: { width: number; height: number }) {
  return (
    <View style={{ 
      width, 
      height: 60, 
      backgroundColor: colors.bg, 
      borderRadius: 4,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <Text style={{ fontSize: 9, color: colors.muted }}>No data available</Text>
    </View>
  );
}

/** Convenience: Booking trend chart */
export function PDFBookingTrendChart({
  data,
  width = CHART_DIMS.width,
  height = CHART_DIMS.height,
}: {
  data: Array<{ date: string; confirmed: number; completed: number; cancelled: number; noShow: number }>;
  width?: number;
  height?: number;
}) {
  return (
    <PDFStackedBarChart
      data={data}
      series={[
        { key: 'completed', color: CHART_COLORS.success, label: 'Completed' },
        { key: 'confirmed', color: CHART_COLORS.primary, label: 'Confirmed' },
        { key: 'cancelled', color: CHART_COLORS.warning, label: 'Cancelled' },
        { key: 'noShow', color: CHART_COLORS.danger, label: 'No-Show' },
      ]}
      width={width}
      height={height}
    />
  );
}

/** Convenience: Traffic source trend chart */
export function PDFTrafficTrendChart({
  data,
  width = CHART_DIMS.width,
  height = CHART_DIMS.height,
}: {
  data: Array<{ date: string; direct: number; organic: number; paid: number; social: number; email: number; referral: number }>;
  width?: number;
  height?: number;
}) {
  return (
    <PDFStackedBarChart
      data={data}
      series={[
        { key: 'direct', color: CHART_COLORS.primary, label: 'Direct' },
        { key: 'organic', color: CHART_COLORS.success, label: 'Organic' },
        { key: 'paid', color: CHART_COLORS.warning, label: 'Paid' },
        { key: 'social', color: CHART_COLORS.purple, label: 'Social' },
        { key: 'email', color: CHART_COLORS.orange, label: 'Email' },
        { key: 'referral', color: CHART_COLORS.teal, label: 'Referral' },
      ]}
      width={width}
      height={height}
    />
  );
}
