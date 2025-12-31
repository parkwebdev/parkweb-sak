/**
 * PDF Section Component
 * 
 * Container for report sections with title and optional chart/table.
 * Includes proper page break handling to prevent content cutoff.
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
    marginBottom: SPACING.XS,
  },

  description: {
    fontSize: FONT_SIZE.SM,
    color: colors.muted,
    marginBottom: SPACING.MD,
  },
  
  content: {
    // Content styling handled by children
  },
});

interface PDFSectionProps {
  title: string;
  /** Optional description shown below the title */
  description?: string;
  children: React.ReactNode;
  /** If true, forces a page break before this section */
  break?: boolean;
}

export function PDFSection({ title, description, children, break: pageBreak }: PDFSectionProps) {
  return (
    <View 
      style={sectionStyles.container} 
      break={pageBreak}
      wrap={false}
    >
      <Text style={sectionStyles.title}>{title}</Text>
      {description && <Text style={sectionStyles.description}>{description}</Text>}
      <View style={sectionStyles.content}>{children}</View>
    </View>
  );
}
