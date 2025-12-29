/**
 * PDF Generator using @react-pdf/renderer
 * 
 * Generates PDFs using React components with native vector charts.
 * No DOM scraping or SVG extraction required.
 */

import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { AnalyticsReportPDF } from './pdf-components';
import type { PDFData, PDFConfig } from '@/types/pdf';

export type { PDFData, PDFConfig, ReportType } from '@/types/pdf';

interface GenerateOptions {
  data: PDFData;
  config: PDFConfig;
  startDate: Date;
  endDate: Date;
  orgName: string;
}

/**
 * Generate a PDF report using @react-pdf/renderer with native charts.
 * 
 * @param opts - Generation options including data and config
 * @returns Promise resolving to a Blob of the generated PDF
 * @throws Error with descriptive message if PDF generation fails
 */
export async function generateBeautifulPDF(opts: GenerateOptions): Promise<Blob> {
  const { data, config, startDate, endDate, orgName } = opts;

  // Create the PDF document with native chart components
  const doc = React.createElement(AnalyticsReportPDF, {
    data,
    config,
    startDate,
    endDate,
    orgName,
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
