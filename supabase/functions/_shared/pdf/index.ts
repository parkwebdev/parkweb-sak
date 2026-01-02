/**
 * PDF Components Index for Edge Functions
 * 
 * Exports all PDF components for use in edge functions.
 */

export { AnalyticsReportPDF } from './AnalyticsReportPDF.tsx';
export { PDFHeader } from './PDFHeader.tsx';
export { PDFFooter } from './PDFFooter.tsx';
export { PDFSection } from './PDFSection.tsx';
export { PDFTable } from './PDFTable.tsx';
export { PDFExecutiveSummary } from './PDFExecutiveSummary.tsx';
export { PDFLogo } from './PDFLogo.tsx';
export { registerFonts } from './fonts.ts';
export { styles, colors, PAGE, SPACING, FONT_SIZE } from './styles.ts';
export { sanitizePDFData, normalizePDFConfig, getTriggerLabel } from './pdf-utils.ts';
export * from './charts.tsx';
export * from './chart-utils.ts';
export type { PDFData, PDFConfig, ReportType, ReportGrouping } from './types.ts';
