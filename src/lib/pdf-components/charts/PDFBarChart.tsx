/**
 * PDF Bar Chart
 * 
 * Native @react-pdf/renderer bar chart component.
 * Supports vertical bars with optional grouping.
 */

import { View, Svg, G, Rect, Line, Text as SvgText, StyleSheet, Text } from '@react-pdf/renderer';
import { 
  scaleLinear, 
  scaleBand,
  generateTicks, 
  formatAxisValue,
  CHART_COLORS,
  CHART_DIMS,
} from './pdf-chart-utils';
import { colors } from '../styles';

const chartStyles = StyleSheet.create({
  axisLabel: { fontSize: 8 },
  axisLabelSmall: { fontSize: 7 },
  legendLabel: { fontSize: 7 },
});

interface DataPoint {
  label: string;
  [key: string]: string | number;
}

interface PDFBarChartProps {
  data: DataPoint[];
  valueKey: string;
  labelKey?: string;
  color?: string;
  width?: number;
  height?: number;
  horizontal?: boolean;
}

export function PDFBarChart({
  data,
  valueKey,
  labelKey = 'label',
  color = CHART_COLORS.primary,
  width = CHART_DIMS.width,
  height = CHART_DIMS.height,
}: PDFBarChartProps) {
  if (!data?.length) {
    return <PDFBarChartEmpty width={width} height={height} />;
  }

  const { padding } = CHART_DIMS;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Y scale (values)
  const values = data.map(d => Number(d[valueKey]) || 0);
  const maxY = Math.max(...values, 1);
  const yTicks = generateTicks(0, maxY, 5);
  const yScale = scaleLinear([0, yTicks[yTicks.length - 1]], [plotHeight, 0]);

  // X scale (categories)
  const labels = data.map(d => String(d[labelKey]));
  const { scale: xScale, bandwidth } = scaleBand(labels, [0, plotWidth], 8);

  return (
    <View style={{ width, height, marginBottom: 8 }}>
      <Svg width={width} height={height}>
        <Rect x={0} y={0} width={width} height={height} fill={colors.white} />

        {/* Y-axis grid lines */}
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

        {/* Bars */}
        <G>
          {data.map((d, i) => {
            const value = Number(d[valueKey]) || 0;
            const barHeight = plotHeight - yScale(value);
            const x = padding.left + xScale(String(d[labelKey]));
            const y = padding.top + yScale(value);
            
            return (
              <Rect
                key={`bar-${i}`}
                x={x}
                y={y}
                width={bandwidth}
                height={barHeight}
                fill={color}
                rx={2}
              />
            );
          })}
        </G>

        {/* X-axis labels */}
        <G>
          {data.map((d, i) => {
            const label = String(d[labelKey]);
            const x = padding.left + xScale(label) + bandwidth / 2;
            const displayLabel = label.length > 12 ? label.slice(0, 10) + '…' : label;
            
            return (
              <SvgText
                key={`x-${i}`}
                x={x}
                y={height - 8}
                fill={colors.secondary}
                style={chartStyles.axisLabelSmall}
                textAnchor="middle"
              >
                {displayLabel}
              </SvgText>
            );
          })}
        </G>
      </Svg>
    </View>
  );
}

/** Grouped bar chart for multiple series */
interface GroupedBarChartProps {
  data: DataPoint[];
  series: Array<{ key: string; color: string; label?: string }>;
  labelKey?: string;
  width?: number;
  height?: number;
}

export function PDFGroupedBarChart({
  data,
  series,
  labelKey = 'label',
  width = CHART_DIMS.width,
  height = CHART_DIMS.height,
}: GroupedBarChartProps) {
  if (!data?.length || !series?.length) {
    return <PDFBarChartEmpty width={width} height={height} />;
  }

  const { padding } = CHART_DIMS;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Y scale
  let maxY = 0;
  for (const d of data) {
    for (const s of series) {
      const val = Number(d[s.key]) || 0;
      if (val > maxY) maxY = val;
    }
  }
  maxY = maxY || 1;
  
  const yTicks = generateTicks(0, maxY, 5);
  const yScale = scaleLinear([0, yTicks[yTicks.length - 1]], [plotHeight, 0]);

  // X scale
  const labels = data.map(d => String(d[labelKey]));
  const { scale: xScale, bandwidth: groupWidth } = scaleBand(labels, [0, plotWidth], 16);
  const barWidth = (groupWidth - 4) / series.length;

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

        {/* Grouped bars */}
        <G>
          {data.map((d, di) => {
            const groupX = padding.left + xScale(String(d[labelKey]));
            
            return (
              <G key={`group-${di}`}>
                {series.map((s, si) => {
                  const value = Number(d[s.key]) || 0;
                  const barHeight = plotHeight - yScale(value);
                  const x = groupX + si * barWidth + 2;
                  const y = padding.top + yScale(value);
                  
                  return (
                    <Rect
                      key={`bar-${di}-${si}`}
                      x={x}
                      y={y}
                      width={barWidth - 2}
                      height={barHeight}
                      fill={s.color}
                      rx={1}
                    />
                  );
                })}
              </G>
            );
          })}
        </G>

        {/* X-axis labels */}
        <G>
          {data.map((d, i) => {
            const label = String(d[labelKey]);
            const x = padding.left + xScale(label) + groupWidth / 2;
            const displayLabel = label.length > 10 ? label.slice(0, 8) + '…' : label;
            
            return (
              <SvgText
                key={`x-${i}`}
                x={x}
                y={height - 8}
                fill={colors.secondary}
                style={chartStyles.axisLabelSmall}
                textAnchor="middle"
              >
                {displayLabel}
              </SvgText>
            );
          })}
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

function PDFBarChartEmpty({ width }: { width: number; height: number }) {
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

/** Horizontal bar chart */
export function PDFHorizontalBarChart({
  data,
  valueKey,
  labelKey = 'label',
  color = CHART_COLORS.primary,
  width = CHART_DIMS.width,
  height,
}: PDFBarChartProps) {
  if (!data?.length) {
    return <PDFBarChartEmpty width={width} height={height || 100} />;
  }

  const chartHeight = height || Math.max(80, data.length * 28);
  const padding = { top: 10, right: 40, bottom: 10, left: 100 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const values = data.map(d => Number(d[valueKey]) || 0);
  const maxX = Math.max(...values, 1);
  const xScale = scaleLinear([0, maxX], [0, plotWidth]);

  const labels = data.map(d => String(d[labelKey]));
  const { scale: yScale, bandwidth } = scaleBand(labels, [0, plotHeight], 4);

  return (
    <View style={{ width, height: chartHeight, marginBottom: 8 }}>
      <Svg width={width} height={chartHeight}>
        <Rect x={0} y={0} width={width} height={chartHeight} fill={colors.white} />

        {/* Bars with labels */}
        <G>
          {data.map((d, i) => {
            const value = Number(d[valueKey]) || 0;
            const barWidth = xScale(value);
            const label = String(d[labelKey]);
            const y = padding.top + yScale(label);
            const displayLabel = label.length > 15 ? label.slice(0, 13) + '…' : label;
            
            return (
              <G key={`bar-${i}`}>
                {/* Label */}
                <SvgText
                  x={padding.left - 8}
                  y={y + bandwidth / 2 + 3}
                  fill={colors.secondary}
                  style={chartStyles.axisLabel}
                  textAnchor="end"
                >
                  {displayLabel}
                </SvgText>
                
                {/* Bar */}
                <Rect
                  x={padding.left}
                  y={y}
                  width={barWidth}
                  height={bandwidth}
                  fill={color}
                  rx={2}
                />
                
                {/* Value */}
                <SvgText
                  x={padding.left + barWidth + 6}
                  y={y + bandwidth / 2 + 3}
                  fill={colors.secondary}
                  style={chartStyles.axisLabel}
                >
                  {formatAxisValue(value)}
                </SvgText>
              </G>
            );
          })}
        </G>
      </Svg>
    </View>
  );
}
