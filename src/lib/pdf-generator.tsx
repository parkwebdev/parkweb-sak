/**
 * PDF Generator using @react-pdf/renderer
 * 
 * Generates PDFs using React components instead of imperative jsPDF calls.
 * Uses SVG chart extraction for vector graphics in PDFs.
 */

import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { AnalyticsReportPDF, type PDFData, type PDFConfig, type ChartImageData } from './pdf-components';

export type { PDFData, PDFConfig, ChartImageData };

interface GenerateOptions {
  data: PDFData;
  config: PDFConfig;
  startDate: Date;
  endDate: Date;
  orgName: string;
  charts?: Map<string, ChartImageData>;
}

/**
 * Generate a PDF report using @react-pdf/renderer.
 * 
 * @param opts - Generation options including data, config, and chart images
 * @returns Promise resolving to a Blob of the generated PDF
 * @throws Error with descriptive message if PDF generation fails
 */
export async function generateBeautifulPDF(opts: GenerateOptions): Promise<Blob> {
  const { data, config, startDate, endDate, orgName, charts } = opts;

  // Convert Map to the expected format if needed
  const chartMap = charts instanceof Map ? charts : new Map();

  // Create the PDF document
  const doc = React.createElement(AnalyticsReportPDF, {
    data,
    config,
    startDate,
    endDate,
    orgName,
    charts: chartMap,
  });

  try {
    // Generate the PDF blob
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blob = await pdf(doc as any).toBlob();
    return blob;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[PDF Generator] Failed to generate PDF:', error);
    throw new Error(`PDF generation failed: ${message}`);
  }
}
