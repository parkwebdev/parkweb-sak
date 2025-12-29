/**
 * SVG chart extraction for PDF export
 *
 * Extracts Recharts-generated <svg> markup from an offscreen render container.
 */

export interface SvgChartData {
  id: string;
  svgString: string;
  width: number;
  height: number;
}

export interface ExtractProgress {
  current: number;
  total: number;
  chartId: string;
}

function normalizeSvg(svg: SVGSVGElement): string {
  // Ensure xmlns is present so parsing is consistent.
  if (!svg.getAttribute('xmlns')) svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  if (!svg.getAttribute('xmlns:xlink')) svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  // Remove animations / non-deterministic bits (if any)
  svg.querySelectorAll('animate, animateTransform').forEach(n => n.remove());

  return new XMLSerializer().serializeToString(svg);
}

export async function extractChartsFromContainer(
  container: HTMLElement,
  onProgress?: (p: ExtractProgress) => void
): Promise<Map<string, SvgChartData>> {
  const results = new Map<string, SvgChartData>();
  const charts = Array.from(container.querySelectorAll('[data-chart-id]'));
  const total = charts.length;
  if (total === 0) return results;

  for (let i = 0; i < charts.length; i++) {
    const el = charts[i];
    const chartId = el.getAttribute('data-chart-id');
    if (!chartId) continue;

    onProgress?.({ current: i + 1, total, chartId });

    const svg = el.querySelector('svg');
    if (!(svg instanceof SVGSVGElement)) continue;

    const rect = svg.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width || Number(svg.getAttribute('width')) || 0));
    const height = Math.max(1, Math.round(rect.height || Number(svg.getAttribute('height')) || 0));

    results.set(chartId, {
      id: chartId,
      svgString: normalizeSvg(svg),
      width,
      height,
    });
  }

  return results;
}

export function waitForRender(ms = 300): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}
