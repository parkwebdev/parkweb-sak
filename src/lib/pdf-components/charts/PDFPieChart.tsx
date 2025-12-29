/**
 * PDF Pie Chart
 * 
 * Native @react-pdf/renderer pie/donut chart component.
 */

import { View, Svg, G, Path, Text as SvgText, StyleSheet } from '@react-pdf/renderer';
import { 
  buildArcPath,
  CHART_COLOR_ARRAY,
} from './pdf-chart-utils';

const chartStyles = StyleSheet.create({
  legendLabel: { fontSize: 7 },
  legendPercent: { fontSize: 6 },
  centerValue: { fontSize: 14, fontWeight: 700 },
  centerLabel: { fontSize: 8 },
});

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface PDFPieChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  showLabels?: boolean;
  showLegend?: boolean;
  donut?: boolean;
}

export function PDFPieChart({
  data,
  width = 200,
  height = 160,
  showLegend = true,
  donut = false,
}: PDFPieChartProps) {
  if (!data?.length) {
    return <PDFPieChartEmpty width={width} height={height} />;
  }

  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);
  if (total === 0) {
    return <PDFPieChartEmpty width={width} height={height} />;
  }

  const cx = width / 2 - (showLegend ? 40 : 0);
  const cy = height / 2;
  const radius = Math.min(cx, cy) - 20;
  const innerRadius = donut ? radius * 0.5 : 0;

  // Calculate segments
  let currentAngle = -Math.PI / 2; // Start from top
  const segments = data.map((d, i) => {
    const percentage = (d.value / total) * 100;
    const angle = (d.value / total) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const color = d.color || CHART_COLOR_ARRAY[i % CHART_COLOR_ARRAY.length];
    
    return {
      ...d,
      percentage,
      startAngle,
      endAngle,
      color,
      path: buildArcPath(cx, cy, radius, startAngle, endAngle),
    };
  });

  return (
    <View style={{ width, height, marginBottom: 8 }}>
      <Svg width={width} height={height}>
        {/* Pie segments */}
        <G>
          {segments.map((seg, i) => (
            <Path
              key={`segment-${i}`}
              d={seg.path}
              fill={seg.color}
            />
          ))}
        </G>

        {/* Donut hole */}
        {donut && (
          <G>
            <Path
              d={`M ${cx} ${cy} m ${-innerRadius} 0 a ${innerRadius} ${innerRadius} 0 1 0 ${innerRadius * 2} 0 a ${innerRadius} ${innerRadius} 0 1 0 ${-innerRadius * 2} 0`}
              fill="#ffffff"
            />
          </G>
        )}

        {/* Legend */}
        {showLegend && (
          <G>
            {segments.slice(0, 6).map((seg, i) => {
              const legendX = width - 80;
              const legendY = 20 + i * 18;
              const displayLabel = seg.label.length > 10 ? seg.label.slice(0, 8) + '…' : seg.label;
              
              return (
                <G key={`legend-${i}`}>
                  <Path
                    d={`M ${legendX} ${legendY} h 10 v 10 h -10 z`}
                    fill={seg.color}
                  />
                  <SvgText
                    x={legendX + 14}
                    y={legendY + 8}
                    fill="#475569"
                    style={chartStyles.legendLabel}
                  >
                    {displayLabel}
                  </SvgText>
                  <SvgText
                    x={legendX + 14}
                    y={legendY + 16}
                    fill="#94a3b8"
                    style={chartStyles.legendPercent}
                  >
                    {seg.percentage.toFixed(1)}%
                  </SvgText>
                </G>
              );
            })}
          </G>
        )}

        {/* Center total for donut */}
        {donut && (
          <G>
            <SvgText
              x={cx}
              y={cy - 4}
              fill="#0f172a"
              style={chartStyles.centerValue}
              textAnchor="middle"
            >
              {total.toLocaleString()}
            </SvgText>
            <SvgText
              x={cx}
              y={cy + 10}
              fill="#64748b"
              style={chartStyles.centerLabel}
              textAnchor="middle"
            >
              Total
            </SvgText>
          </G>
        )}
      </Svg>
    </View>
  );
}

function PDFPieChartEmpty({ width, height }: { width: number; height: number }) {
  return (
    <View style={{ 
      width, 
      height: 60, 
      backgroundColor: '#f8fafc', 
      borderRadius: 4,
    }} />
  );
}

/** Convenience: Traffic source pie chart */
interface TrafficSourceData {
  source: string;
  visitors: number;
  percentage?: number;
}

export function PDFTrafficSourceChart({ 
  data,
  width = 240,
  height = 160,
}: { 
  data: TrafficSourceData[];
  width?: number;
  height?: number;
}) {
  const pieData = data.map((d, i) => ({
    label: d.source,
    value: d.visitors,
    color: CHART_COLOR_ARRAY[i % CHART_COLOR_ARRAY.length],
  }));

  return (
    <PDFPieChart
      data={pieData}
      width={width}
      height={height}
      donut
      showLegend
    />
  );
}
