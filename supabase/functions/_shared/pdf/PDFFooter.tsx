/**
 * PDF Footer Component for Edge Functions
 * 
 * Ported from src/lib/pdf-components/PDFFooter.tsx
 */

// @ts-ignore - npm import for Deno
import React from 'npm:react@18.3.1';
// @ts-ignore - npm import for Deno
import { View, Text, StyleSheet } from 'npm:@react-pdf/renderer@4.3.0';
import { colors, PAGE, SPACING, FONT_SIZE } from './styles.ts';
import { PDFLogo } from './PDFLogo.tsx';

const footerStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: PAGE.MARGIN,
    right: PAGE.MARGIN,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.SM,
    borderTopWidth: 1,
    borderTopColor: colors.bgAlt,
  },
  
  branding: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  brandingText: {
    fontSize: FONT_SIZE.XS,
    color: colors.muted,
    marginLeft: 4,
  },
  
  pageNumber: {
    fontSize: FONT_SIZE.XS,
    color: colors.secondary,
  },
});

export function PDFFooter() {
  return React.createElement(
    View,
    { style: footerStyles.container, fixed: true },
    React.createElement(
      View,
      { style: footerStyles.branding },
      React.createElement(PDFLogo, { size: 12, color: colors.muted }),
      React.createElement(Text, { style: footerStyles.brandingText }, 'Powered by Pilot')
    ),
    React.createElement(
      Text,
      { 
        style: footerStyles.pageNumber,
        render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => 
          `Page ${pageNumber} of ${totalPages}`
      }
    )
  );
}
