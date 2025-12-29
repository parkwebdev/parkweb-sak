/**
 * PDF Footer Component
 * 
 * Page footer with page number and branding.
 */

import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors, PAGE, SPACING, FONT_SIZE } from './styles';

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
    fontSize: FONT_SIZE.XS,
    color: colors.muted,
  },
  
  pageNumber: {
    fontSize: FONT_SIZE.XS,
    color: colors.secondary,
  },
});

export function PDFFooter() {
  return (
    <View style={footerStyles.container} fixed>
      <Text style={footerStyles.branding}>Powered by Ari</Text>
      <Text 
        style={footerStyles.pageNumber}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  );
}
