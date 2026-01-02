/**
 * PDF Header Component for Edge Functions
 * 
 * Ported from src/lib/pdf-components/PDFHeader.tsx
 */

// @ts-ignore - npm import for Deno
import React from 'npm:react@18.3.1';
// @ts-ignore - npm import for Deno
import { View, Text, StyleSheet } from 'npm:@react-pdf/renderer@4.3.0';
// @ts-ignore - npm import for Deno
import { format } from 'npm:date-fns@3.6.0';
import { colors, PAGE, SPACING, FONT_SIZE } from './styles.ts';
import { PDFLogo } from './PDFLogo.tsx';
import type { ReportType } from './types.ts';

const headerStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    paddingHorizontal: PAGE.MARGIN,
    paddingTop: SPACING.LG,
    paddingBottom: SPACING.LG,
    marginTop: -PAGE.MARGIN,
  },
  
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  logoContainer: {
    marginRight: SPACING.MD,
  },
  
  textContainer: {
    flex: 1,
  },
  
  right: {
    alignItems: 'flex-end',
  },
  
  orgName: {
    fontSize: FONT_SIZE.XL,
    fontWeight: 700,
    color: colors.white,
    marginBottom: SPACING.XS,
  },
  
  reportTitle: {
    fontSize: FONT_SIZE.MD,
    color: colors.muted,
  },
  
  dateRange: {
    fontSize: FONT_SIZE.SM,
    color: colors.white,
    marginBottom: SPACING.XS,
  },
  
  generatedAt: {
    fontSize: FONT_SIZE.XS,
    color: colors.muted,
  },
});

interface PDFHeaderProps {
  orgName: string;
  startDate: Date;
  endDate: Date;
  reportType?: ReportType;
}

export function PDFHeader({ orgName, startDate, endDate, reportType = 'detailed' }: PDFHeaderProps) {
  const reportTitle = reportType === 'summary' 
    ? 'Summary Report' 
    : reportType === 'comparison' 
      ? 'Comparison Report' 
      : 'Analytics Report';
  
  const dateText = `${format(startDate, 'MMM d')} – ${format(endDate, 'MMM d, yyyy')}`;
  const generatedText = `Generated ${format(new Date(), 'MMM d, yyyy h:mm a')}`;

  return React.createElement(
    View,
    { style: headerStyles.container },
    React.createElement(
      View,
      { style: headerStyles.row },
      React.createElement(
        View,
        { style: headerStyles.left },
        React.createElement(
          View,
          { style: headerStyles.logoContainer },
          React.createElement(PDFLogo, { size: 32, color: colors.white })
        ),
        React.createElement(
          View,
          { style: headerStyles.textContainer },
          React.createElement(Text, { style: headerStyles.orgName }, orgName),
          React.createElement(Text, { style: headerStyles.reportTitle }, reportTitle)
        )
      ),
      React.createElement(
        View,
        { style: headerStyles.right },
        React.createElement(Text, { style: headerStyles.dateRange }, dateText),
        React.createElement(Text, { style: headerStyles.generatedAt }, generatedText)
      )
    )
  );
}
