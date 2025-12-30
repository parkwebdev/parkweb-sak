/**
 * PDF KPI Cards Component
 * 
 * Displays key performance indicators in a clean card grid.
 */

import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors, SPACING, FONT_SIZE } from './styles';

const kpiStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: SPACING.XL,
    gap: SPACING.MD,
  },
  
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: SPACING.LG,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  value: {
    fontSize: FONT_SIZE.XXL,
    fontWeight: 700,
    color: colors.primary,
    marginBottom: SPACING.XS,
  },
  
  label: {
    fontSize: FONT_SIZE.SM,
    color: colors.secondary,
    marginBottom: SPACING.XS,
  },
  
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  changePositive: {
    fontSize: FONT_SIZE.XS,
    color: colors.success,
  },
  
  changeNegative: {
    fontSize: FONT_SIZE.XS,
    color: colors.danger,
  },
  
  changeNeutral: {
    fontSize: FONT_SIZE.XS,
    color: colors.muted,
  },
});

interface KPIData {
  label: string;
  value: string | number;
  change?: number | null;
  suffix?: string;
}

interface PDFKPICardsProps {
  kpis: KPIData[];
}

export function PDFKPICards({ kpis }: PDFKPICardsProps) {
  return (
    <View style={kpiStyles.container} wrap={false}>
      {kpis.map((kpi, index) => {
        const changeStyle = kpi.change == null 
          ? kpiStyles.changeNeutral 
          : kpi.change >= 0 
            ? kpiStyles.changePositive 
            : kpiStyles.changeNegative;
        
        const changePrefix = kpi.change != null && kpi.change >= 0 ? '+' : '';
        
        return (
          <View key={index} style={kpiStyles.card}>
            <Text style={kpiStyles.value}>
              {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
              {kpi.suffix || ''}
            </Text>
            <Text style={kpiStyles.label}>{kpi.label}</Text>
            {kpi.change != null && (
              <View style={kpiStyles.changeRow}>
                <Text style={changeStyle}>
                  {changePrefix}{kpi.change.toFixed(1)}% vs prev period
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
