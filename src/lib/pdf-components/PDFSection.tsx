/**
 * PDF Section Component
 * 
 * Container for report sections with title and optional chart/table.
 */

import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors, SPACING, FONT_SIZE } from './styles';

const sectionStyles = StyleSheet.create({
  container: {
    marginBottom: SPACING.XL,
  },
  
  title: {
    fontSize: FONT_SIZE.LG,
    fontWeight: 600,
    color: colors.primary,
    marginBottom: SPACING.MD,
    paddingLeft: SPACING.SM,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  
  content: {
    // Content styling
  },
});

interface PDFSectionProps {
  title: string;
  children: React.ReactNode;
}

export function PDFSection({ title, children }: PDFSectionProps) {
  return (
    <View style={sectionStyles.container}>
      <Text style={sectionStyles.title}>{title}</Text>
      <View style={sectionStyles.content}>{children}</View>
    </View>
  );
}
