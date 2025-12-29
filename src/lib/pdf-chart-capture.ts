/**
 * PDF Chart Capture Module
 * 
 * Captures DOM elements as images for PDF embedding.
 * Uses dynamic import of html2canvas to avoid SSR issues.
 */

/** Captured chart image data */
export interface ChartImage {
  id: string;
  dataUrl: string;
  width: number;
  height: number;
}

/** Progress callback data */
export interface CaptureProgress {
  current: number;
  total: number;
  chartId: string;
}

/**
 * Captures a single DOM element as a PNG image.
 * @param element - The DOM element to capture
 * @param options - Capture options
 * @returns Promise with image data URL and dimensions
 */
export async function captureElement(
  element: HTMLElement,
  options: { scale?: number; bg?: string } = {}
): Promise<{ dataUrl: string; w: number; h: number }> {
  const { scale = 2, bg = '#ffffff' } = options;
  
  // Dynamic import to avoid bundling issues
  const mod = await import('html2canvas');
  const html2canvas = mod.default;

  const canvas = await html2canvas(element, {
    scale,
    backgroundColor: bg,
    logging: false,
    useCORS: true,
    allowTaint: true,
    imageTimeout: 0,
    removeContainer: true,
  });

  return {
    dataUrl: canvas.toDataURL('image/png', 1.0),
    w: canvas.width / scale,
    h: canvas.height / scale,
  };
}

/**
 * Captures multiple chart elements by their data-chart-id attribute.
 * @param container - Container element with chart children
 * @param onProgress - Optional progress callback
 * @returns Map of chart IDs to their captured images
 */
export async function captureChartsFromContainer(
  container: HTMLElement,
  onProgress?: (p: CaptureProgress) => void
): Promise<Map<string, ChartImage>> {
  const results = new Map<string, ChartImage>();
  const charts = container.querySelectorAll('[data-chart-id]');
  const total = charts.length;

  for (let i = 0; i < charts.length; i++) {
    const chart = charts[i];
    const id = chart.getAttribute('data-chart-id');
    
    if (!id || !(chart instanceof HTMLElement)) continue;

    onProgress?.({ current: i + 1, total, chartId: id });

    try {
      const { dataUrl, w, h } = await captureElement(chart);
      results.set(id, { id, dataUrl, width: w, height: h });
    } catch (err) {
      console.warn(`Failed to capture chart: ${id}`, err);
    }

    // Small delay between captures
    await new Promise(r => setTimeout(r, 50));
  }

  return results;
}

/**
 * Waits for charts to finish rendering.
 * @param ms - Milliseconds to wait
 */
export function waitForRender(ms = 500): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}