/**
 * PDF Line Chart
 * 
 * Native @react-pdf/renderer line chart component.
 * Renders crisp vector graphics directly in PDF.
 */

import { View, Svg, G, Path, Line, Text as SvgText, Rect, StyleSheet, Text } from '@react-pdf/renderer';
import { 
  scaleLinear, 
  generateTicks, 
  formatAxisValue, 
  formatDateLabel,
  buildLinePath,
  downsampleData,
  CHART_COLORS,
  CHART_DIMS,
} from './pdf-chart-utils';
import { colors } from '../styles';

const chartStyles = StyleSheet.create({
  axisLabel: { fontSize: 8 },
  axisLabelSmall: { fontSize: 7 },
  legendLabel: { fontSize: 8 },
  legendLabelSmall: { fontSize: 7 },
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

interface PDFLineChartProps {
  data: DataPoint[];
  series: Series[];
  width?: number;
  height?: number;
  title?: string;
  maxPoints?: number;
}

export function PDFLineChart({
  data,
  series,
  width = CHART_DIMS.width,
  height = CHART_DIMS.height,
  maxPoints = 30,
}: PDFLineChartProps) {
  if (!data?.length || !series?.length) {
    return <PDFLineChartEmpty width={width} height={height} />;
  }

  const sampledData = downsampleData(data, maxPoints);
  const { padding } = CHART_DIMS;
  
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Calculate Y domain across all series
  let minY = Infinity;
  let maxY = -Infinity;
  
  for (const d of sampledData) {
    for (const s of series) {
      const val = Number(d[s.key]) || 0;
      if (val < minY) minY = val;
      if (val > maxY) maxY = val;
    }
  }
  
  // Handle edge case of all zeros or same values
  if (minY === maxY) {
    minY = 0;
    maxY = maxY || 1;
  }
  if (minY > 0) minY = 0; // Start from 0 for line charts

  const yTicks = generateTicks(minY, maxY, 5);
  const yScale = scaleLinear([yTicks[0], yTicks[yTicks.length - 1]], [plotHeight, 0]);
  
  const xStep = plotWidth / (sampledData.length - 1 || 1);

  // Build paths for each series
  const paths = series.map(s => {
    const points = sampledData.map((d, i) => ({
      x: padding.left + i * xStep,
      y: padding.top + yScale(Number(d[s.key]) || 0),
    }));
    return { ...s, path: buildLinePath(points) };
  });

  // X-axis labels (show ~5-7 labels)
  const xLabelStep = Math.max(1, Math.floor(sampledData.length / 6));
  const xLabels = sampledData
    .filter((_, i) => i % xLabelStep === 0 || i === sampledData.length - 1)
    .map((d) => ({
      label: formatDateLabel(d.date),
      x: padding.left + (sampledData.indexOf(d)) * xStep,
    }));

  return (
    <View style={{ width, height, marginBottom: 8 }} wrap={false}>
      <Svg width={width} height={height}>
        {/* Background */}
        <Rect x={0} y={0} width={width} height={height} fill={colors.white} />
        
        {/* Y-axis grid lines and labels */}
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
                  stroke={colors.bgMuted}
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

        {/* Line paths */}
        <G>
          {paths.map((p, i) => (
            <Path
              key={`line-${i}`}
              d={p.path}
              stroke={p.color}
              strokeWidth={2}
              fill="none"
            />
          ))}
        </G>

        {/* Legend */}
        {series.length > 1 && (
          <G>
            {series.map((s, i) => (
              <G key={`legend-${i}`}>
                <Rect
                  x={padding.left + i * 80}
                  y={4}
                  width={10}
                  height={10}
                  fill={s.color}
                  rx={2}
                />
                <SvgText
                  x={padding.left + i * 80 + 14}
                  y={12}
                  fill={colors.secondary}
                  style={chartStyles.legendLabel}
                >
                  {s.label || s.key}
                </SvgText>
              </G>
            ))}
          </G>
        )}
      </Svg>
    </View>
  );
}

function PDFLineChartEmpty({ width }: { width: number; height: number }) {
  return (
    <View style={{ 
      width, 
      height: 60, 
      backgroundColor: colors.bgAlt, 
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <Text style={{ fontSize: 9, color: colors.muted }}>No data available</Text>
    </View>
  );
}

/** Convenience: single-series line chart */
export function PDFSimpleLineChart({
  data,
  valueKey,
  color = CHART_COLORS.primary,
  ...props
}: Omit<PDFLineChartProps, 'series'> & { valueKey: string; color?: string }) {
  return (
    <PDFLineChart
      data={data}
      series={[{ key: valueKey, color }]}
      {...props}
    />
  );
}
