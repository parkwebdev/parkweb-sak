/**
 * PDF Header Component
 * 
 * Branded header with ChatPad logo, organization name, report title, and date range.
 */

import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { colors, PAGE, SPACING, FONT_SIZE } from './styles';
import { PDFLogo } from './PDFLogo';

const headerStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    paddingHorizontal: PAGE.MARGIN,
    paddingTop: SPACING.LG,
    paddingBottom: SPACING.LG,
    marginTop: -PAGE.MARGIN,      // Pull header up into page padding (first page only)
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
  reportType?: 'summary' | 'detailed' | 'comparison';
}

export function PDFHeader({ orgName, startDate, endDate, reportType = 'detailed' }: PDFHeaderProps) {
  const reportTitle = reportType === 'summary' 
    ? 'Summary Report' 
    : reportType === 'comparison' 
      ? 'Comparison Report' 
      : 'Analytics Report';
  
  const dateText = `${format(startDate, 'MMM d')} – ${format(endDate, 'MMM d, yyyy')}`;
  const generatedText = `Generated ${format(new Date(), 'MMM d, yyyy h:mm a')}`;

  return (
    <View style={headerStyles.container}>
      <View style={headerStyles.row}>
        <View style={headerStyles.left}>
          <View style={headerStyles.logoContainer}>
            <PDFLogo size={32} color={colors.white} />
          </View>
          <View style={headerStyles.textContainer}>
            <Text style={headerStyles.orgName}>{orgName}</Text>
            <Text style={headerStyles.reportTitle}>{reportTitle}</Text>
          </View>
        </View>
        <View style={headerStyles.right}>
          <Text style={headerStyles.dateRange}>{dateText}</Text>
          <Text style={headerStyles.generatedAt}>{generatedText}</Text>
        </View>
      </View>
    </View>
  );
}
