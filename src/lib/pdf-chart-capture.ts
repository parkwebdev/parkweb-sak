/**
 * PDF Chart Capture Module
 * 
 * Captures DOM elements as images for PDF embedding.
 * Uses pre-imported html2canvas with parallel capture for performance.
 */

import type Html2Canvas from 'html2canvas';

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

// Cache html2canvas module for reuse
let html2canvasLib: typeof Html2Canvas | null = null;

/**
 * Pre-imports and caches html2canvas for faster subsequent captures.
 */
async function getHtml2Canvas(): Promise<typeof Html2Canvas> {
  if (!html2canvasLib) {
    const mod = await import('html2canvas');
    html2canvasLib = mod.default;
  }
  return html2canvasLib;
}

/**
 * Pre-warms the html2canvas library by importing it ahead of time.
 * Call this early to eliminate import delay during capture.
 */
export async function preloadHtml2Canvas(): Promise<void> {
  await getHtml2Canvas();
}

/**
 * Captures a single DOM element as a PNG image.
 * @param element - The DOM element to capture
 * @param options - Capture options
 * @returns Promise with image data URL and dimensions
 */
export async function captureElement(
  element: HTMLElement,
  options: { scale?: number; bg?: string; quality?: number } = {}
): Promise<{ dataUrl: string; w: number; h: number }> {
  // Reduced scale for smaller file size while maintaining quality
  const { scale = 1.5, bg = '#ffffff', quality = 0.85 } = options;
  
  const html2canvas = await getHtml2Canvas();

  const canvas = await html2canvas(element, {
    scale,
    backgroundColor: bg,
    logging: false,
    useCORS: true,
    allowTaint: true,
    imageTimeout: 0,
    removeContainer: true,
  });

  // Use JPEG for smaller file size (typically 50-70% smaller than PNG)
  return {
    dataUrl: canvas.toDataURL('image/jpeg', quality),
    w: canvas.width / scale,
    h: canvas.height / scale,
  };
}

/**
 * Captures multiple chart elements by their data-chart-id attribute.
 * Uses parallel batching for performance (4 charts at a time).
 * @param container - Container element with chart children
 * @param onProgress - Optional progress callback
 * @returns Map of chart IDs to their captured images
 */
export async function captureChartsFromContainer(
  container: HTMLElement,
  onProgress?: (p: CaptureProgress) => void
): Promise<Map<string, ChartImage>> {
  const results = new Map<string, ChartImage>();
  const charts = Array.from(container.querySelectorAll('[data-chart-id]'));
  const total = charts.length;

  if (total === 0) return results;

  // Pre-warm html2canvas before capture loop
  await getHtml2Canvas();

  // Batch size for parallel capture
  const BATCH_SIZE = 4;

  for (let i = 0; i < charts.length; i += BATCH_SIZE) {
    const batch = charts.slice(i, i + BATCH_SIZE);
    
    // Capture batch in parallel
    const batchResults = await Promise.all(
      batch.map(async (chart, batchIndex) => {
        const id = chart.getAttribute('data-chart-id');
        if (!id || !(chart instanceof HTMLElement)) return null;

        const globalIndex = i + batchIndex;
        onProgress?.({ current: globalIndex + 1, total, chartId: id });

        try {
          const { dataUrl, w, h } = await captureElement(chart);
          return { id, dataUrl, width: w, height: h };
        } catch (err) {
          console.warn(`Failed to capture chart: ${id}`, err);
          return null;
        }
      })
    );

    // Add successful captures to results
    for (const result of batchResults) {
      if (result) {
        results.set(result.id, result);
      }
    }
  }

  return results;
}

/**
 * Waits for charts to finish rendering.
 * @param ms - Milliseconds to wait
 */
export function waitForRender(ms = 300): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}
