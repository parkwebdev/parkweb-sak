/**
 * PDF Section Component for Edge Functions
 * 
 * Ported from src/lib/pdf-components/PDFSection.tsx
 */

// @ts-ignore - npm import for Deno
import React from 'npm:react@18.3.1';
// @ts-ignore - npm import for Deno
import { View, Text, StyleSheet } from 'npm:@react-pdf/renderer@4.3.0';
import { colors, SPACING, FONT_SIZE } from './styles.ts';

const sectionStyles = StyleSheet.create({
  container: {
    marginBottom: SPACING.XL,
  },
  
  title: {
    fontSize: FONT_SIZE.LG,
    fontWeight: 600,
    color: colors.primary,
    marginBottom: SPACING.XS,
  },

  description: {
    fontSize: FONT_SIZE.SM,
    color: colors.muted,
    marginBottom: SPACING.MD,
  },
  
  content: {},
});

interface PDFSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  break?: boolean;
}

export function PDFSection({ title, description, children, break: pageBreak }: PDFSectionProps) {
  return React.createElement(
    View,
    { 
      style: sectionStyles.container, 
      break: pageBreak,
      wrap: false
    },
    React.createElement(Text, { style: sectionStyles.title }, title),
    description && React.createElement(Text, { style: sectionStyles.description }, description),
    React.createElement(View, { style: sectionStyles.content }, children)
  );
}
