/**
 * PDF Footer Component
 * 
 * Page footer with ChatPad logo, branding, and page number.
 */

import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors, PAGE, SPACING, FONT_SIZE } from './styles';
import { PDFLogo } from './PDFLogo';

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
  return (
    <View style={footerStyles.container} fixed>
      <View style={footerStyles.branding}>
        <PDFLogo size={12} color={colors.muted} />
        <Text style={footerStyles.brandingText}>Powered by Pilot</Text>
      </View>
      <Text 
        style={footerStyles.pageNumber}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  );
}
