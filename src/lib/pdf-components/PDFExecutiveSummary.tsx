/**
 * PDF Executive Summary Component
 * 
 * Displays key insights and highlights at the top of the report.
 */

import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors, SPACING, FONT_SIZE } from './styles';
import type { PDFData } from '@/types/pdf';

const summaryStyles = StyleSheet.create({
  container: {
    marginBottom: SPACING.XL,
    padding: SPACING.LG,
    backgroundColor: colors.bgAlt,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  title: {
    fontSize: FONT_SIZE.LG,
    fontWeight: 600,
    color: colors.primary,
    marginBottom: SPACING.SM,
  },

  subtitle: {
    fontSize: FONT_SIZE.SM,
    color: colors.muted,
    marginBottom: SPACING.MD,
  },
  
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
  },

  insightCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 6,
    padding: SPACING.MD,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: SPACING.SM,
  },

  insightLabel: {
    fontSize: FONT_SIZE.XS,
    color: colors.muted,
    marginBottom: SPACING.XS,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  insightValue: {
    fontSize: FONT_SIZE.MD,
    fontWeight: 600,
    color: colors.primary,
  },

  insightSubtext: {
    fontSize: FONT_SIZE.XS,
    color: colors.secondary,
    marginTop: SPACING.XS,
  },

  highlightsSection: {
    marginTop: SPACING.MD,
    paddingTop: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  highlightsTitle: {
    fontSize: FONT_SIZE.SM,
    fontWeight: 600,
    color: colors.primary,
    marginBottom: SPACING.SM,
  },

  highlight: {
    flexDirection: 'row',
    marginBottom: SPACING.XS,
  },

  bullet: {
    fontSize: FONT_SIZE.SM,
    color: colors.primary,
    marginRight: SPACING.XS,
  },

  highlightText: {
    fontSize: FONT_SIZE.SM,
    color: colors.secondary,
    flex: 1,
  },
});

interface PDFExecutiveSummaryProps {
  data: PDFData;
}

export function PDFExecutiveSummary({ data }: PDFExecutiveSummaryProps) {
  // Calculate key metrics
  const conversionRate = data.conversionRate ?? 0;
  const totalConversations = data.totalConversations ?? 0;
  const totalLeads = data.totalLeads ?? 0;
  
  // AI Performance
  const containmentRate = data.aiPerformanceStats?.containment_rate ?? 0;
  const resolutionRate = data.aiPerformanceStats?.resolution_rate ?? 0;
  
  // Satisfaction
  const avgRating = data.satisfactionStats?.average_rating ?? 0;
  const totalRatings = data.satisfactionStats?.total_ratings ?? 0;

  // Traffic
  const topSource = data.trafficSources?.[0];
  
  // Top page
  const topPage = data.topPages?.[0];

  // Build highlights based on available data
  const highlights: string[] = [];
  
  if (totalConversations > 0) {
    highlights.push(`${totalConversations.toLocaleString()} total conversations with a ${conversionRate.toFixed(1)}% lead conversion rate.`);
  }
  
  if (containmentRate > 0) {
    highlights.push(`Ari handled ${containmentRate}% of conversations autonomously with ${resolutionRate}% resolution rate.`);
  }
  
  if (avgRating > 0 && totalRatings > 0) {
    highlights.push(`Customer satisfaction averaged ${avgRating.toFixed(1)}/5 across ${totalRatings.toLocaleString()} ratings.`);
  }
  
  if (topSource) {
    highlights.push(`${topSource.source} was the top traffic source with ${topSource.percentage}% of visitors.`);
  }
  
  if (topPage && topPage.visits > 0) {
    const pageName = topPage.page.length > 40 ? topPage.page.substring(0, 37) + '...' : topPage.page;
    highlights.push(`Most visited page: "${pageName}" with ${topPage.visits.toLocaleString()} visits.`);
  }

  return (
    <View style={summaryStyles.container} wrap={false}>
      <Text style={summaryStyles.title}>Executive Summary</Text>
      <Text style={summaryStyles.subtitle}>
        Key performance highlights from the selected period
      </Text>
      
      <View style={summaryStyles.insightsGrid}>
        <View style={summaryStyles.insightCard}>
          <Text style={summaryStyles.insightLabel}>Conversations</Text>
          <Text style={summaryStyles.insightValue}>{totalConversations.toLocaleString()}</Text>
          {data.conversationsChange !== undefined && data.conversationsChange !== null && (
            <Text style={summaryStyles.insightSubtext}>
              {data.conversationsChange > 0 ? '+' : ''}{data.conversationsChange.toFixed(1)}% vs previous period
            </Text>
          )}
        </View>

        <View style={summaryStyles.insightCard}>
          <Text style={summaryStyles.insightLabel}>Leads Generated</Text>
          <Text style={summaryStyles.insightValue}>{totalLeads.toLocaleString()}</Text>
          {data.leadsChange !== undefined && data.leadsChange !== null && (
            <Text style={summaryStyles.insightSubtext}>
              {data.leadsChange > 0 ? '+' : ''}{data.leadsChange.toFixed(1)}% vs previous period
            </Text>
          )}
        </View>

        <View style={summaryStyles.insightCard}>
          <Text style={summaryStyles.insightLabel}>Conversion Rate</Text>
          <Text style={summaryStyles.insightValue}>{conversionRate.toFixed(1)}%</Text>
          <Text style={summaryStyles.insightSubtext}>Visitor to lead conversion</Text>
        </View>

        <View style={summaryStyles.insightCard}>
          <Text style={summaryStyles.insightLabel}>Customer Satisfaction</Text>
          <Text style={summaryStyles.insightValue}>{avgRating > 0 ? `${avgRating.toFixed(1)}/5` : 'N/A'}</Text>
          {totalRatings > 0 && (
            <Text style={summaryStyles.insightSubtext}>Based on {totalRatings.toLocaleString()} ratings</Text>
          )}
        </View>
      </View>

      {highlights.length > 0 && (
        <View style={summaryStyles.highlightsSection}>
          <Text style={summaryStyles.highlightsTitle}>Key Insights</Text>
          {highlights.slice(0, 5).map((highlight, index) => (
            <View style={summaryStyles.highlight} key={index}>
              <Text style={summaryStyles.bullet}>•</Text>
              <Text style={summaryStyles.highlightText}>{highlight}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
