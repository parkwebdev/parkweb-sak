/**
 * PDF Header Component
 * 
 * Branded header with organization name, report title, and date range.
 */

import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { colors, PAGE, SPACING, FONT_SIZE } from './styles';

const headerStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.headerBg,
    paddingHorizontal: PAGE.MARGIN,
    paddingTop: SPACING.XL,
    paddingBottom: SPACING.LG,
  },
  
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  
  left: {
    flex: 1,
  },
  
  right: {
    alignItems: 'flex-end',
  },
  
  orgName: {
    fontSize: FONT_SIZE.XXL,
    fontWeight: 700,
    color: colors.headerText,
    marginBottom: SPACING.XS,
  },
  
  reportTitle: {
    fontSize: FONT_SIZE.LG,
    color: colors.headerSubtext,
  },
  
  dateRange: {
    fontSize: FONT_SIZE.MD,
    color: colors.headerText,
    marginBottom: SPACING.XS,
  },
  
  generatedAt: {
    fontSize: FONT_SIZE.SM,
    color: colors.headerSubtext,
  },
  
  accentLine: {
    height: 3,
    backgroundColor: colors.accent,
    marginTop: SPACING.LG,
    marginHorizontal: -PAGE.MARGIN,
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
          <Text style={headerStyles.orgName}>{orgName}</Text>
          <Text style={headerStyles.reportTitle}>{reportTitle}</Text>
        </View>
        <View style={headerStyles.right}>
          <Text style={headerStyles.dateRange}>{dateText}</Text>
          <Text style={headerStyles.generatedAt}>{generatedText}</Text>
        </View>
      </View>
      <View style={headerStyles.accentLine} />
    </View>
  );
}
