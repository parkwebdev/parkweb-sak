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
  
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
    marginBottom: SPACING.MD,
  },

  metricCard: {
    width: '31%',
    backgroundColor: colors.white,
    borderRadius: 6,
    padding: SPACING.MD,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: SPACING.SM,
  },

  metricLabel: {
    fontSize: FONT_SIZE.XS,
    color: colors.muted,
    marginBottom: SPACING.XS,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  metricValue: {
    fontSize: FONT_SIZE.XXL,
    fontWeight: 700,
    color: colors.primary,
  },

  metricSubtext: {
    fontSize: FONT_SIZE.XS,
    color: colors.secondary,
    marginTop: SPACING.XS,
  },

  metricChangePositive: {
    fontSize: FONT_SIZE.XS,
    color: colors.success,
    marginTop: SPACING.XS,
  },

  metricChangeNegative: {
    fontSize: FONT_SIZE.XS,
    color: colors.danger,
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
  const aiHandled = data.aiPerformanceStats?.ai_handled ?? 0;
  const humanTakeover = data.aiPerformanceStats?.human_takeover ?? 0;
  
  // Satisfaction
  const avgRating = data.satisfactionStats?.average_rating ?? 0;
  const totalRatings = data.satisfactionStats?.total_ratings ?? 0;

  // Traffic
  const topSource = data.trafficSources?.[0];
  const totalVisitors = data.trafficSources?.reduce((sum, s) => sum + s.visitors, 0) ?? 0;
  
  // Top page
  const topPage = data.topPages?.[0];

  // Bookings
  const totalBookings = data.bookingStats?.reduce((sum, s) => sum + s.total, 0) ?? 0;
  const avgShowRate = data.bookingStats?.length 
    ? Math.round(data.bookingStats.reduce((sum, s) => sum + s.show_rate, 0) / data.bookingStats.length)
    : 0;

  // Page engagement
  const bounceRate = data.pageEngagement?.bounceRate ?? 0;
  const avgPagesPerSession = data.pageEngagement?.avgPagesPerSession ?? 0;

  // Build highlights based on available data
  const highlights: string[] = [];
  
  if (totalConversations > 0 && totalLeads > 0) {
    highlights.push(`Generated ${totalLeads.toLocaleString()} leads from ${totalConversations.toLocaleString()} conversations (${conversionRate.toFixed(1)}% conversion rate).`);
  }
  
  if (containmentRate > 0) {
    highlights.push(`Ari autonomously handled ${containmentRate}% of conversations with a ${resolutionRate}% resolution rate.`);
  }

  if (humanTakeover > 0 && aiHandled > 0) {
    const escalationRate = ((humanTakeover / (aiHandled + humanTakeover)) * 100).toFixed(1);
    highlights.push(`Human escalation rate was ${escalationRate}% (${humanTakeover.toLocaleString()} conversations required human intervention).`);
  }
  
  if (avgRating > 0 && totalRatings > 0) {
    highlights.push(`Customer satisfaction score: ${avgRating.toFixed(1)}/5 based on ${totalRatings.toLocaleString()} feedback submissions.`);
  }
  
  if (topSource && totalVisitors > 0) {
    highlights.push(`Top traffic source: ${topSource.source} drove ${topSource.percentage}% of ${totalVisitors.toLocaleString()} total visitors.`);
  }
  
  if (topPage && topPage.visits > 0) {
    const pageName = topPage.page.length > 35 ? topPage.page.substring(0, 32) + '...' : topPage.page;
    highlights.push(`Best performing page: "${pageName}" with ${topPage.visits.toLocaleString()} visits and ${topPage.bounce_rate}% bounce rate.`);
  }

  if (totalBookings > 0) {
    highlights.push(`${totalBookings.toLocaleString()} total bookings with ${avgShowRate}% average show rate.`);
  }

  if (bounceRate > 0) {
    highlights.push(`Site engagement: ${bounceRate.toFixed(1)}% bounce rate with ${avgPagesPerSession.toFixed(1)} avg pages per session.`);
  }

  const formatChange = (change: number | null | undefined) => {
    if (change === null || change === undefined) return null;
    return {
      text: `${change > 0 ? '+' : ''}${change.toFixed(1)}% vs prev`,
      isPositive: change >= 0,
    };
  };

  const conversationsChange = formatChange(data.conversationsChange);
  const leadsChange = formatChange(data.leadsChange);

  return (
    <View style={summaryStyles.container} wrap={false}>
      <Text style={summaryStyles.title}>Executive Summary</Text>
      <Text style={summaryStyles.subtitle}>
        Key performance highlights from the selected period
      </Text>
      
      {/* Primary Metrics Row */}
      <View style={summaryStyles.metricsGrid}>
        <View style={summaryStyles.metricCard}>
          <Text style={summaryStyles.metricLabel}>Conversations</Text>
          <Text style={summaryStyles.metricValue}>{totalConversations.toLocaleString()}</Text>
          {conversationsChange && (
            <Text style={conversationsChange.isPositive ? summaryStyles.metricChangePositive : summaryStyles.metricChangeNegative}>
              {conversationsChange.text}
            </Text>
          )}
        </View>

        <View style={summaryStyles.metricCard}>
          <Text style={summaryStyles.metricLabel}>Leads Generated</Text>
          <Text style={summaryStyles.metricValue}>{totalLeads.toLocaleString()}</Text>
          {leadsChange && (
            <Text style={leadsChange.isPositive ? summaryStyles.metricChangePositive : summaryStyles.metricChangeNegative}>
              {leadsChange.text}
            </Text>
          )}
        </View>

        <View style={summaryStyles.metricCard}>
          <Text style={summaryStyles.metricLabel}>Conversion Rate</Text>
          <Text style={summaryStyles.metricValue}>{conversionRate.toFixed(1)}%</Text>
          <Text style={summaryStyles.metricSubtext}>Visitor → Lead</Text>
        </View>
      </View>

      {/* Secondary Metrics Row */}
      <View style={summaryStyles.metricsGrid}>
        <View style={summaryStyles.metricCard}>
          <Text style={summaryStyles.metricLabel}>Customer Satisfaction</Text>
          <Text style={summaryStyles.metricValue}>{avgRating > 0 ? `${avgRating.toFixed(1)}` : 'N/A'}</Text>
          {totalRatings > 0 && (
            <Text style={summaryStyles.metricSubtext}>{totalRatings.toLocaleString()} ratings</Text>
          )}
        </View>

        <View style={summaryStyles.metricCard}>
          <Text style={summaryStyles.metricLabel}>AI Containment</Text>
          <Text style={summaryStyles.metricValue}>{containmentRate > 0 ? `${containmentRate}%` : 'N/A'}</Text>
          <Text style={summaryStyles.metricSubtext}>Handled by Ari</Text>
        </View>

        <View style={summaryStyles.metricCard}>
          <Text style={summaryStyles.metricLabel}>Total Visitors</Text>
          <Text style={summaryStyles.metricValue}>{totalVisitors.toLocaleString()}</Text>
          {topSource && (
            <Text style={summaryStyles.metricSubtext}>Top: {topSource.source}</Text>
          )}
        </View>
      </View>

      {highlights.length > 0 && (
        <View style={summaryStyles.highlightsSection}>
          <Text style={summaryStyles.highlightsTitle}>Key Insights</Text>
          {highlights.slice(0, 6).map((highlight, index) => (
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
