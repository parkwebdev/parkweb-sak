/**
 * PDF Table Component
 * 
 * Renders data tables with proper styling and alternating rows.
 */

import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors, SPACING, FONT_SIZE } from './styles';

const tableStyles = StyleSheet.create({
  table: {
    width: '100%',
    marginBottom: SPACING.MD,
  },
  
  headerRow: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 28,
  },
  
  headerCell: {
    padding: SPACING.SM,
    color: colors.white,
    fontSize: FONT_SIZE.SM,
    fontWeight: 600,
  },
  
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.bgAlt,
    minHeight: 26,
  },
  
  rowAlt: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgAlt,
    minHeight: 26,
  },
  
  cell: {
    padding: SPACING.SM,
    fontSize: FONT_SIZE.BASE,
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
    return String(value);
  };

  return (
    <View style={tableStyles.table}>
      {/* Header */}
      <View style={tableStyles.headerRow}>
        {columns.map((col) => (
          <Text key={col.key} style={getCellStyle(col, true)}>
            {col.header}
          </Text>
        ))}
      </View>
      
      {/* Rows */}
      {displayData.map((row, rowIndex) => (
        <View 
          key={rowIndex} 
          style={rowIndex % 2 === 0 ? tableStyles.row : tableStyles.rowAlt}
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
