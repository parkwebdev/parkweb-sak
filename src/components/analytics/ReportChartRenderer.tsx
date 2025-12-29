/**
 * ReportChartRenderer Component
 * 
 * Renders chart components offscreen for PDF capture.
 * Uses a hidden container with fixed dimensions for consistent export.
 * 
 * @module components/analytics/ReportChartRenderer
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { captureCharts, CapturedChart, ChartCaptureProgress } from '@/lib/chart-capture-utils';
import { ReportConfig } from './BuildReportSheet';
import type { ReportData } from '@/types/report';
import { format, parseISO } from 'date-fns';

// Chart components
import { ConversationChart } from './ConversationChart';
import { ConversationFunnelCard } from './ConversationFunnelCard';
import { PeakActivityChart } from './PeakActivityChart';
import { BookingTrendChart } from './BookingTrendChart';
import { BookingsByLocationChart } from './BookingsByLocationChart';
import { TrafficSourceChart } from './TrafficSourceChart';
import { TrafficSourceTrendChart } from './TrafficSourceTrendChart';
import { TopPagesChart } from './TopPagesChart';
import { PageDepthChart } from './PageDepthChart';
import { LeadSourceBreakdownCard } from './LeadSourceBreakdownCard';
import { CSATDistributionCard } from './CSATDistributionCard';
import { LeadConversionChart } from './LeadConversionChart';

interface ReportChartRendererProps {
  data: ReportData;
  config: ReportConfig;
  onCapture: (charts: Map<string, CapturedChart>) => void;
  onProgress?: (progress: ChartCaptureProgress) => void;
  onError?: (error: Error) => void;
}

const CHART_WIDTH = 700;
const CHART_HEIGHT = 400;

/**
 * Renders charts in a hidden container and captures them as images.
 */
export const ReportChartRenderer = React.memo(function ReportChartRenderer({
  data,
  config,
  onCapture,
  onProgress,
  onError,
}: ReportChartRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);

  // Create portal container on mount
  useEffect(() => {
    const container = document.createElement('div');
    container.id = 'report-chart-renderer-portal';
    container.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: ${CHART_WIDTH}px;
      pointer-events: none;
      z-index: -1;
      background: white;
    `;
    document.body.appendChild(container);
    setPortalContainer(container);

    return () => {
      document.body.removeChild(container);
    };
  }, []);

  // Capture charts after render
  const captureAllCharts = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      // Wait for charts to fully render
      await new Promise(resolve => setTimeout(resolve, 800));

      const chartElements = new Map<string, HTMLElement>();

      // Find all chart containers by data attribute
      const charts = containerRef.current.querySelectorAll('[data-chart-id]');
      charts.forEach(chart => {
        const id = chart.getAttribute('data-chart-id');
        if (id && chart instanceof HTMLElement) {
          chartElements.set(id, chart);
        }
      });

      if (chartElements.size === 0) {
        onCapture(new Map());
        return;
      }

      const captured = await captureCharts(chartElements, onProgress);
      onCapture(captured);
    } catch (error) {
      console.error('Chart capture failed:', error);
      onError?.(error instanceof Error ? error : new Error('Chart capture failed'));
    }
  }, [onCapture, onProgress, onError]);

  // Trigger capture when rendered
  useEffect(() => {
    if (isRendered && portalContainer) {
      captureAllCharts();
    }
  }, [isRendered, portalContainer, captureAllCharts]);

  // Mark as rendered after initial paint
  useEffect(() => {
    if (portalContainer) {
      const timer = setTimeout(() => setIsRendered(true), 100);
      return () => clearTimeout(timer);
    }
  }, [portalContainer]);

  if (!portalContainer) return null;

  // Transform data for charts
  const conversationChartData = data.conversationStats?.map(stat => ({
    date: stat.date,
    total: stat.total,
    active: stat.active,
    closed: stat.closed,
  })) || [];

  const peakActivityData = data.conversationStats?.map(stat => ({
    date: stat.date,
    total: stat.total,
  })) || [];

  // Traffic source trend data transformation
  const trafficSourceTrendData = data.trafficSourceTrend?.map(item => ({
    date: item.date,
    formattedDate: (() => {
      try {
        return format(parseISO(item.date), 'MMM d');
      } catch {
        return item.date;
      }
    })(),
    direct: item.direct,
    organic: item.organic,
    paid: item.paid,
    social: item.social,
    email: item.email,
    referral: item.referral,
    total: item.total,
  })) || [];

  // Lead conversion data transformation
  const leadConversionData = data.leadConversionTrend?.map(item => ({
    ...item,
    formattedDate: (() => {
      try {
        return format(parseISO(item.date as string), 'MMM d');
      } catch {
        return item.date as string;
      }
    })(),
  })) || [];

  // Booking trend data transformation (matches BookingTrendData interface)
  const bookingTrendData = data.bookingTrend?.map(item => ({
    date: item.date,
    formattedDate: (() => {
      try {
        return format(parseISO(item.date), 'MMM d');
      } catch {
        return item.date;
      }
    })(),
    confirmed: item.confirmed,
    completed: item.completed,
    cancelled: item.cancelled,
    noShow: item.noShow,
    total: item.total,
  })) || [];

  // Traffic source chart data (matches TrafficSourceData interface)
  const trafficSourceData = data.trafficSources?.map(source => ({
    name: source.source,
    value: source.visitors,
    fill: getSourceColor(source.source),
  })) || [];

  // Booking by location data (matches BookingsByLocationChartProps)
  const bookingsByLocationData = data.bookingStats?.map(stat => ({
    locationName: stat.location,
    bookings: stat.total,
    completed: stat.completed,
    cancelled: stat.cancelled,
    noShow: stat.no_show,
  })) || [];

  // Top pages data (matches TopPageData interface)
  const topPagesData = data.topPages?.map(page => ({
    url: page.page,
    visits: page.visits,
    avgDuration: 0, // Not available in current data
    conversions: page.conversations,
    bounceRate: page.bounce_rate,
  })) || [];

  // Page depth data (matches PageDepthData interface)
  const pageDepthData = data.pageDepthDistribution?.map(item => ({
    depth: item.depth,
    count: item.count,
    percentage: item.percentage,
  })) || [];

  // Lead source breakdown data (matches LeadSourceData interface)
  const leadSourceData = data.leadSourceBreakdown?.map(source => ({
    source: source.source,
    leads: source.leads,
    sessions: source.sessions,
    cvr: source.cvr,
  })) || [];

  // CSAT distribution data
  const csatDistributionData = data.satisfactionStats?.distribution?.map(d => ({
    rating: d.rating,
    count: d.count,
    percentage: d.percentage,
  })) || [];

  return createPortal(
    <div
      ref={containerRef}
      className="bg-background text-foreground"
      style={{ width: CHART_WIDTH }}
    >
      {/* Conversation Chart */}
      {config.includeConversations && conversationChartData.length > 0 && (
        <div 
          data-chart-id="conversation-volume"
          style={{ width: CHART_WIDTH, minHeight: CHART_HEIGHT, padding: 16 }}
          className="bg-card"
        >
          <ConversationChart data={conversationChartData} />
        </div>
      )}

      {/* Conversation Funnel */}
      {config.includeConversationFunnel && data.conversationFunnel && data.conversationFunnel.length > 0 && (
        <div 
          data-chart-id="conversation-funnel"
          style={{ width: CHART_WIDTH, minHeight: 300, padding: 16 }}
          className="bg-card"
        >
          <ConversationFunnelCard stages={data.conversationFunnel} />
        </div>
      )}

      {/* Peak Activity */}
      {config.includePeakActivity && peakActivityData.length > 0 && (
        <div 
          data-chart-id="peak-activity"
          style={{ width: CHART_WIDTH, minHeight: 350, padding: 16 }}
          className="bg-card"
        >
          <PeakActivityChart conversationStats={peakActivityData} />
        </div>
      )}

      {/* Booking Trend */}
      {config.includeBookingTrend && bookingTrendData.length > 0 && (
        <div 
          data-chart-id="booking-trend"
          style={{ width: CHART_WIDTH, minHeight: CHART_HEIGHT, padding: 16 }}
          className="bg-card"
        >
          <BookingTrendChart data={bookingTrendData} />
        </div>
      )}

      {/* Bookings by Location */}
      {config.includeBookings && bookingsByLocationData.length > 0 && (
        <div 
          data-chart-id="bookings-by-location"
          style={{ width: CHART_WIDTH, minHeight: CHART_HEIGHT, padding: 16 }}
          className="bg-card"
        >
          <BookingsByLocationChart data={bookingsByLocationData} />
        </div>
      )}

      {/* Traffic Sources */}
      {config.includeTrafficSources && trafficSourceData.length > 0 && (
        <div 
          data-chart-id="traffic-sources"
          style={{ width: CHART_WIDTH, minHeight: CHART_HEIGHT, padding: 16 }}
          className="bg-card"
        >
          <TrafficSourceChart data={trafficSourceData} />
        </div>
      )}

      {/* Traffic Source Trend */}
      {config.includeTrafficSourceTrend && trafficSourceTrendData.length > 0 && (
        <div 
          data-chart-id="traffic-source-trend"
          style={{ width: CHART_WIDTH, minHeight: CHART_HEIGHT, padding: 16 }}
          className="bg-card"
        >
          <TrafficSourceTrendChart data={trafficSourceTrendData} />
        </div>
      )}

      {/* Top Pages */}
      {config.includeTopPages && topPagesData.length > 0 && (
        <div 
          data-chart-id="top-pages"
          style={{ width: CHART_WIDTH, minHeight: CHART_HEIGHT, padding: 16 }}
          className="bg-card"
        >
          <TopPagesChart data={topPagesData} />
        </div>
      )}

      {/* Page Depth */}
      {config.includePageDepth && pageDepthData.length > 0 && (
        <div 
          data-chart-id="page-depth"
          style={{ width: CHART_WIDTH, minHeight: 300, padding: 16 }}
          className="bg-card"
        >
          <PageDepthChart data={pageDepthData} />
        </div>
      )}

      {/* Lead Source Breakdown */}
      {config.includeLeadSourceBreakdown && leadSourceData.length > 0 && (
        <div 
          data-chart-id="lead-source-breakdown"
          style={{ width: CHART_WIDTH, minHeight: 300, padding: 16 }}
          className="bg-card"
        >
          <LeadSourceBreakdownCard data={leadSourceData} />
        </div>
      )}

      {/* CSAT Distribution */}
      {config.includeSatisfaction && csatDistributionData.length > 0 && (
        <div 
          data-chart-id="csat-distribution"
          style={{ width: CHART_WIDTH, minHeight: 300, padding: 16 }}
          className="bg-card"
        >
          <CSATDistributionCard 
            distribution={csatDistributionData}
            averageRating={data.satisfactionStats?.average_rating || 0}
            totalRatings={data.satisfactionStats?.total_ratings || 0}
          />
        </div>
      )}

      {/* Lead Conversion Chart */}
      {config.includeLeadConversionTrend && leadConversionData.length > 0 && (
        <div 
          data-chart-id="lead-conversion-trend"
          style={{ width: CHART_WIDTH, minHeight: CHART_HEIGHT, padding: 16 }}
          className="bg-card"
        >
          <LeadConversionChart data={leadConversionData} />
        </div>
      )}
    </div>,
    portalContainer
  );
});

// Helper function to get source color
function getSourceColor(source: string): string {
  const colors: Record<string, string> = {
    Direct: 'hsl(220, 90%, 56%)',
    Organic: 'hsl(142, 76%, 36%)',
    Paid: 'hsl(38, 92%, 50%)',
    Social: 'hsl(280, 85%, 58%)',
    Email: 'hsl(340, 75%, 54%)',
    Referral: 'hsl(190, 95%, 45%)',
  };
  return colors[source] || 'hsl(var(--muted))';
}
