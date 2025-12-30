/**
 * PDF Table Component
 * 
 * Renders data tables with proper styling and page break handling.
 */

import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { format, parseISO, isValid } from 'date-fns';
import { colors, SPACING, FONT_SIZE } from './styles';

const tableStyles = StyleSheet.create({
  table: {
    width: '100%',
    marginBottom: SPACING.SM,
  },
  
  headerRow: {
    flexDirection: 'row',
    backgroundColor: colors.bgMuted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 22,
  },
  
  headerCell: {
    padding: SPACING.XS,
    paddingVertical: 5,
    color: colors.primary,
    fontSize: FONT_SIZE.SM,
    fontWeight: 600,
  },
  
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 18,
    backgroundColor: colors.white,
  },
  
  rowAlt: {
    flexDirection: 'row',
    backgroundColor: colors.bgAlt,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 18,
  },
  
  cell: {
    padding: SPACING.XS,
    paddingVertical: 3,
    fontSize: FONT_SIZE.SM,
    color: colors.primary,
  },
});
interface ColumnDef {
  key: string;
  header: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
}

interface PDFTableProps {
  columns: ColumnDef[];
  data: Record<string, string | number | null | undefined>[];
  maxRows?: number;
}

export function PDFTable({ columns, data, maxRows = 15 }: PDFTableProps) {
  const displayData = data.slice(0, maxRows);

  const getCellStyle = (col: ColumnDef, isHeader = false) => {
    const baseStyle = isHeader ? tableStyles.headerCell : tableStyles.cell;
    const widthStyle = col.width ? { width: col.width, flex: undefined } : { flex: 1 };
    const alignStyle = col.align === 'right' 
      ? { textAlign: 'right' as const } 
      : col.align === 'center' 
        ? { textAlign: 'center' as const } 
        : {};
    
    return { ...baseStyle, ...widthStyle, ...alignStyle };
  };

  const formatValue = (value: string | number | null | undefined): string => {
    if (value == null) return '-';
    if (typeof value === 'number') return value.toLocaleString();
    
    // Check if it's an ISO date string (YYYY-MM-DD)
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      const parsed = parseISO(value);
      if (isValid(parsed)) {
        return format(parsed, 'MMM d, yyyy');
      }
    }
    
    return String(value);
  };

  return (
    <View style={tableStyles.table}>
      {/* Header - wrap={false} prevents header from being orphaned */}
      <View style={tableStyles.headerRow} wrap={false}>
        {columns.map((col) => (
          <Text key={col.key} style={getCellStyle(col, true)}>
            {col.header}
          </Text>
        ))}
      </View>
      
      {/* Rows - each row tries to stay together */}
      {displayData.map((row, rowIndex) => (
        <View 
          key={rowIndex} 
          style={rowIndex % 2 === 0 ? tableStyles.row : tableStyles.rowAlt}
          wrap={false}
        >
          {columns.map((col) => (
            <Text key={col.key} style={getCellStyle(col)}>
              {formatValue(row[col.key])}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}
