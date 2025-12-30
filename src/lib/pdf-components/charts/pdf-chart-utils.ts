/**
 * PDF Chart Utilities
 * 
 * Math helpers for building PDF-native vector charts.
 * Pure functions - no react-pdf dependencies.
 */

/** Linear scale: maps domain [d0, d1] → range [r0, r1] */
export function scaleLinear(
  domain: [number, number],
  range: [number, number]
): (value: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const dSpan = d1 - d0 || 1;
  const rSpan = r1 - r0;
  return (value: number) => r0 + ((value - d0) / dSpan) * rSpan;
}

/** Band scale: maps categorical data → evenly-spaced positions */
export function scaleBand(
  domain: string[],
  range: [number, number],
  padding = 0.1
): { scale: (key: string) => number; bandwidth: number } {
  const n = domain.length || 1;
  const [r0, r1] = range;
  const totalPadding = padding * (n - 1);
  const bandwidth = (r1 - r0 - totalPadding) / n;
  const indexMap = new Map(domain.map((k, i) => [k, i]));
  
  return {
    scale: (key: string) => {
      const i = indexMap.get(key) ?? 0;
      return r0 + i * (bandwidth + padding);
    },
    bandwidth,
  };
}

/** Generate nice tick values for an axis */
export function generateTicks(min: number, max: number, targetCount = 5): number[] {
  if (min >= max) return [min];
  
  const range = max - min;
  const roughStep = range / (targetCount - 1);
  
  // Find a "nice" step size
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalized = roughStep / magnitude;
  
  let niceStep: number;
  if (normalized <= 1) niceStep = magnitude;
  else if (normalized <= 2) niceStep = 2 * magnitude;
  else if (normalized <= 5) niceStep = 5 * magnitude;
  else niceStep = 10 * magnitude;
  
  const niceMin = Math.floor(min / niceStep) * niceStep;
  const niceMax = Math.ceil(max / niceStep) * niceStep;
  
  const ticks: number[] = [];
  for (let t = niceMin; t <= niceMax + niceStep / 2; t += niceStep) {
    ticks.push(Math.round(t * 1000) / 1000);
  }
  
  return ticks;
}

/** Format numbers for axis labels */
export function formatAxisValue(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
}

/** Format percentage */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/** Format date for chart labels */
export function formatDateLabel(dateStr: string, short = true): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    if (short) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

/** Build SVG path for a line chart */
export function buildLinePath(
  points: Array<{ x: number; y: number }>
): string {
  if (!points.length) return '';
  
  return points.reduce((acc, pt, i) => {
    return acc + (i === 0 ? `M ${pt.x} ${pt.y}` : ` L ${pt.x} ${pt.y}`);
  }, '');
}

/** Build SVG arc path for pie chart segments */
export function buildArcPath(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const start = {
    x: cx + radius * Math.cos(startAngle),
    y: cy + radius * Math.sin(startAngle),
  };
  const end = {
    x: cx + radius * Math.cos(endAngle),
    y: cy + radius * Math.sin(endAngle),
  };
  
  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
  
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

/** Downsample data for readability - max N points */
export function downsampleData<T>(data: T[], maxPoints = 30): T[] {
  if (data.length <= maxPoints) return data;
  
  const step = data.length / maxPoints;
  const result: T[] = [];
  
  for (let i = 0; i < maxPoints; i++) {
    result.push(data[Math.floor(i * step)]);
  }
  
  // Always include the last point
  if (result[result.length - 1] !== data[data.length - 1]) {
    result[result.length - 1] = data[data.length - 1];
  }
  
  return result;
}

/** PDF Chart color palette - muted, professional tones */
export const CHART_COLORS = {
  primary: '#334155',    // slate-700 (main data)
  secondary: '#64748b',  // slate-500
  success: '#059669',    // emerald-600
  warning: '#d97706',    // amber-600
  danger: '#dc2626',     // red-600
  purple: '#7c3aed',     // violet-600
  teal: '#0d9488',       // teal-600
  orange: '#ea580c',     // orange-600
  pink: '#db2777',       // pink-600
  indigo: '#4f46e5',     // indigo-600
} as const;

export const CHART_COLOR_ARRAY = [
  CHART_COLORS.primary,
  CHART_COLORS.teal,
  CHART_COLORS.indigo,
  CHART_COLORS.purple,
  CHART_COLORS.success,
  CHART_COLORS.orange,
  CHART_COLORS.pink,
  CHART_COLORS.warning,
  CHART_COLORS.danger,
  CHART_COLORS.secondary,
];

/** Chart dimensions */
export const CHART_DIMS = {
  width: 515,      // PAGE.CONTENT_WIDTH
  height: 180,
  padding: { top: 20, right: 20, bottom: 30, left: 50 },
} as const;

export type ChartPadding = typeof CHART_DIMS.padding;
