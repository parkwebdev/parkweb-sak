/**
 * Chart Capture Utilities
 * 
 * Uses html2canvas to capture rendered chart components as images
 * for embedding in PDF reports.
 * 
 * @module lib/chart-capture-utils
 */

import html2canvas from 'html2canvas';

export interface CapturedChart {
  id: string;
  imageData: string;
  width: number;
  height: number;
}

export interface ChartCaptureProgress {
  current: number;
  total: number;
  currentChart: string;
}

/**
 * Captures a DOM element as a base64 image using html2canvas.
 */
export const captureElementAsImage = async (
  element: HTMLElement,
  options?: {
    scale?: number;
    backgroundColor?: string;
  }
): Promise<{ imageData: string; width: number; height: number }> => {
  const scale = options?.scale ?? 2; // 2x for retina quality
  const backgroundColor = options?.backgroundColor ?? '#ffffff';

  const canvas = await html2canvas(element, {
    scale,
    backgroundColor,
    logging: false,
    useCORS: true,
    allowTaint: true,
    // Improve rendering quality
    imageTimeout: 0,
    removeContainer: true,
  });

  return {
    imageData: canvas.toDataURL('image/png', 1.0),
    width: canvas.width / scale,
    height: canvas.height / scale,
  };
};

/**
 * Captures multiple chart elements and returns their images.
 * Reports progress through callback for UI updates.
 */
export const captureCharts = async (
  chartElements: Map<string, HTMLElement>,
  onProgress?: (progress: ChartCaptureProgress) => void
): Promise<Map<string, CapturedChart>> => {
  const results = new Map<string, CapturedChart>();
  const entries = Array.from(chartElements.entries());
  const total = entries.length;

  for (let i = 0; i < entries.length; i++) {
    const [id, element] = entries[i];
    
    onProgress?.({
      current: i + 1,
      total,
      currentChart: id,
    });

    try {
      const { imageData, width, height } = await captureElementAsImage(element);
      results.set(id, { id, imageData, width, height });
    } catch (error) {
      console.warn(`Failed to capture chart ${id}:`, error);
      // Continue with other charts
    }

    // Small delay to prevent browser freeze
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  return results;
};

/**
 * Helper to wait for charts to finish rendering before capture.
 */
export const waitForChartRender = (ms: number = 500): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
