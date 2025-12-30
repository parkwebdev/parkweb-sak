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
    borderLeftColor: colors.primary,
  },
  
  content: {
    // Content styling
  },
});

interface PDFSectionProps {
  title: string;
  children: React.ReactNode;
  /** If true, forces a page break before this section */
  break?: boolean;
}

export function PDFSection({ title, children, break: pageBreak }: PDFSectionProps) {
  return (
    <View style={sectionStyles.container} break={pageBreak}>
      <Text style={sectionStyles.title}>{title}</Text>
      <View style={sectionStyles.content}>{children}</View>
    </View>
  );
}
