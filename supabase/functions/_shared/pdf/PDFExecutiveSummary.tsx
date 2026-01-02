/**
 * PDF Executive Summary for Edge Functions
 * Ported from src/lib/pdf-components/PDFExecutiveSummary.tsx
 */

// @ts-ignore
import React from 'npm:react@18.3.1';
// @ts-ignore
import { View, Text, StyleSheet } from 'npm:@react-pdf/renderer@4.3.0';
import { colors, SPACING, FONT_SIZE } from './styles.ts';
import type { PDFData } from './types.ts';

const summaryStyles = StyleSheet.create({
  container: { marginBottom: SPACING.XL, padding: SPACING.LG, backgroundColor: colors.bgAlt, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  title: { fontSize: FONT_SIZE.LG, fontWeight: 600, color: colors.primary, marginBottom: SPACING.SM },
  subtitle: { fontSize: FONT_SIZE.SM, color: colors.muted, marginBottom: SPACING.MD },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.SM, marginBottom: SPACING.MD },
  metricCard: { width: '31%', backgroundColor: colors.white, borderRadius: 6, padding: SPACING.MD, borderWidth: 1, borderColor: colors.border, marginBottom: SPACING.SM },
  metricLabel: { fontSize: FONT_SIZE.XS, color: colors.muted, marginBottom: SPACING.XS, textTransform: 'uppercase', letterSpacing: 0.5 },
  metricValue: { fontSize: FONT_SIZE.XXL, fontWeight: 700, color: colors.primary },
  metricSubtext: { fontSize: FONT_SIZE.XS, color: colors.secondary, marginTop: SPACING.XS },
  metricChangePositive: { fontSize: FONT_SIZE.XS, color: colors.success, marginTop: SPACING.XS },
  metricChangeNegative: { fontSize: FONT_SIZE.XS, color: colors.danger, marginTop: SPACING.XS },
  highlightsSection: { marginTop: SPACING.MD, paddingTop: SPACING.MD, borderTopWidth: 1, borderTopColor: colors.border },
  highlightsTitle: { fontSize: FONT_SIZE.SM, fontWeight: 600, color: colors.primary, marginBottom: SPACING.SM },
  highlight: { flexDirection: 'row', marginBottom: SPACING.XS },
  bullet: { fontSize: FONT_SIZE.SM, color: colors.primary, marginRight: SPACING.XS },
  highlightText: { fontSize: FONT_SIZE.SM, color: colors.secondary, flex: 1 },
});

export function PDFExecutiveSummary({ data }: { data: PDFData }) {
  const conversionRate = data.conversionRate ?? 0;
  const totalConversations = data.totalConversations ?? 0;
  const totalLeads = data.totalLeads ?? 0;
  const containmentRate = data.aiPerformanceStats?.containment_rate ?? 0;
  const avgRating = data.satisfactionStats?.average_rating ?? 0;
  const totalRatings = data.satisfactionStats?.total_ratings ?? 0;
  const totalVisitors = data.trafficSources?.reduce((sum, s) => sum + s.visitors, 0) ?? 0;
  const topSource = data.trafficSources?.[0];

  const highlights: string[] = [];
  if (totalConversations > 0 && totalLeads > 0) {
    highlights.push(`Generated ${totalLeads.toLocaleString()} leads from ${totalConversations.toLocaleString()} conversations (${conversionRate.toFixed(1)}% conversion rate).`);
  }
  if (containmentRate > 0) {
    highlights.push(`Ari autonomously handled ${containmentRate}% of conversations.`);
  }
  if (avgRating > 0 && totalRatings > 0) {
    highlights.push(`Customer satisfaction score: ${avgRating.toFixed(1)}/5 based on ${totalRatings.toLocaleString()} feedback submissions.`);
  }
  if (topSource && totalVisitors > 0) {
    highlights.push(`Top traffic source: ${topSource.source} drove ${topSource.percentage}% of ${totalVisitors.toLocaleString()} total visitors.`);
  }

  const formatChange = (change: number | null | undefined) => {
    if (change === null || change === undefined) return null;
    return { text: `${change > 0 ? '+' : ''}${change.toFixed(1)}% vs prev`, isPositive: change >= 0 };
  };

  const conversationsChange = formatChange(data.conversationsChange);
  const leadsChange = formatChange(data.leadsChange);

  const metricCard = (label: string, value: string, change?: { text: string; isPositive: boolean } | null, subtext?: string) =>
    React.createElement(View, { style: summaryStyles.metricCard },
      React.createElement(Text, { style: summaryStyles.metricLabel }, label),
      React.createElement(Text, { style: summaryStyles.metricValue }, value),
      change && React.createElement(Text, { style: change.isPositive ? summaryStyles.metricChangePositive : summaryStyles.metricChangeNegative }, change.text),
      subtext && React.createElement(Text, { style: summaryStyles.metricSubtext }, subtext)
    );

  return React.createElement(View, { style: summaryStyles.container, wrap: false },
    React.createElement(Text, { style: summaryStyles.title }, 'Executive Summary'),
    React.createElement(Text, { style: summaryStyles.subtitle }, 'Key performance highlights from the selected period'),
    React.createElement(View, { style: summaryStyles.metricsGrid },
      metricCard('Conversations', totalConversations.toLocaleString(), conversationsChange),
      metricCard('Leads Generated', totalLeads.toLocaleString(), leadsChange),
      metricCard('Conversion Rate', `${conversionRate.toFixed(1)}%`, null, 'Visitor → Lead')
    ),
    React.createElement(View, { style: summaryStyles.metricsGrid },
      metricCard('Customer Satisfaction', avgRating > 0 ? avgRating.toFixed(1) : 'N/A', null, totalRatings > 0 ? `${totalRatings.toLocaleString()} ratings` : undefined),
      metricCard('AI Containment', containmentRate > 0 ? `${containmentRate}%` : 'N/A', null, 'Handled by Ari'),
      metricCard('Total Visitors', totalVisitors.toLocaleString(), null, topSource ? `Top: ${topSource.source}` : undefined)
    ),
    highlights.length > 0 && React.createElement(View, { style: summaryStyles.highlightsSection },
      React.createElement(Text, { style: summaryStyles.highlightsTitle }, 'Key Insights'),
      ...highlights.slice(0, 6).map((highlight, index) =>
        React.createElement(View, { style: summaryStyles.highlight, key: index },
          React.createElement(Text, { style: summaryStyles.bullet }, '•'),
          React.createElement(Text, { style: summaryStyles.highlightText }, highlight)
        )
      )
    )
  );
}
