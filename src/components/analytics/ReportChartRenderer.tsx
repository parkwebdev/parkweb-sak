/**
 * ReportChartRenderer Component
 * 
 * Renders chart components offscreen for PDF capture using a portal.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { format, parseISO } from 'date-fns';
import { captureChartsFromContainer, waitForRender } from '@/lib/pdf-chart-capture';
import type { ChartImage, CaptureProgress } from '@/lib/pdf-chart-capture';

// Lazy load chart components
const LazyConversationChart = React.lazy(() => import('./ConversationChart').then(m => ({ default: m.ConversationChart })));
const LazyConversationFunnelCard = React.lazy(() => import('./ConversationFunnelCard').then(m => ({ default: m.ConversationFunnelCard })));
const LazyPeakActivityChart = React.lazy(() => import('./PeakActivityChart').then(m => ({ default: m.PeakActivityChart })));
const LazyBookingTrendChart = React.lazy(() => import('./BookingTrendChart').then(m => ({ default: m.BookingTrendChart })));
const LazyBookingsByLocationChart = React.lazy(() => import('./BookingsByLocationChart').then(m => ({ default: m.BookingsByLocationChart })));
const LazyTrafficSourceChart = React.lazy(() => import('./TrafficSourceChart').then(m => ({ default: m.TrafficSourceChart })));
const LazyTrafficSourceTrendChart = React.lazy(() => import('./TrafficSourceTrendChart').then(m => ({ default: m.TrafficSourceTrendChart })));
const LazyTopPagesChart = React.lazy(() => import('./TopPagesChart').then(m => ({ default: m.TopPagesChart })));
const LazyPageDepthChart = React.lazy(() => import('./PageDepthChart').then(m => ({ default: m.PageDepthChart })));
const LazyLeadSourceBreakdownCard = React.lazy(() => import('./LeadSourceBreakdownCard').then(m => ({ default: m.LeadSourceBreakdownCard })));
const LazyCSATDistributionCard = React.lazy(() => import('./CSATDistributionCard').then(m => ({ default: m.CSATDistributionCard })));
const LazyLeadConversionChart = React.lazy(() => import('./LeadConversionChart').then(m => ({ default: m.LeadConversionChart })));

const CHART_WIDTH = 700;
const CHART_HEIGHT = 400;

interface ChartConfig {
  includeConversations?: boolean;
  includeConversationFunnel?: boolean;
  includePeakActivity?: boolean;
  includeBookingTrend?: boolean;
  includeBookings?: boolean;
  includeTrafficSources?: boolean;
  includeTrafficSourceTrend?: boolean;
  includeTopPages?: boolean;
  includePageDepth?: boolean;
  includeLeadSourceBreakdown?: boolean;
  includeSatisfaction?: boolean;
  includeLeadConversionTrend?: boolean;
}

interface ChartData {
  conversationStats?: Array<{ date: string; total: number; active: number; closed: number }>;
  conversationFunnel?: Array<{ name: string; count: number; percentage: number; dropOffPercent: number; color: string }>;
  bookingTrend?: Array<{ date: string; confirmed: number; completed: number; cancelled: number; noShow: number; total: number }>;
  bookingStats?: Array<{ location: string; total: number; confirmed: number; completed: number; cancelled: number; no_show: number }>;
  trafficSources?: Array<{ source: string; visitors: number; percentage: number }>;
  trafficSourceTrend?: Array<{ date: string; direct: number; organic: number; paid: number; social: number; email: number; referral: number; total: number }>;
  topPages?: Array<{ page: string; visits: number; bounce_rate: number; conversations: number }>;
  pageDepthDistribution?: Array<{ depth: string; count: number; percentage: number }>;
  leadSourceBreakdown?: Array<{ source: string; leads: number; sessions: number; cvr: number }>;
  satisfactionStats?: { average_rating: number; total_ratings: number; distribution: Array<{ rating: number; count: number; percentage: number }> };
  leadConversionTrend?: Array<{ date: string; [key: string]: string | number }>;
}

interface Props {
  data: ChartData;
  config: ChartConfig;
  onCapture: (charts: Map<string, ChartImage>) => void;
  onProgress?: (p: CaptureProgress) => void;
  onError?: (err: Error) => void;
}

export const ReportChartRenderer = React.memo(function ReportChartRenderer({
  data,
  config,
  onCapture,
  onProgress,
  onError,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  // Create hidden portal container
  useEffect(() => {
    const el = document.createElement('div');
    el.id = 'chart-capture-portal';
    el.style.cssText = `position:fixed;left:-9999px;top:0;width:${CHART_WIDTH}px;pointer-events:none;z-index:-1;background:white;`;
    document.body.appendChild(el);
    setPortal(el);
    return () => { document.body.removeChild(el); };
  }, []);

  // Capture after render
  const runCapture = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      await waitForRender(800);
      const charts = await captureChartsFromContainer(containerRef.current, onProgress);
      onCapture(charts);
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error('Capture failed'));
    }
  }, [onCapture, onProgress, onError]);

  useEffect(() => {
    if (ready && portal) runCapture();
  }, [ready, portal, runCapture]);

  useEffect(() => {
    if (portal) {
      const t = setTimeout(() => setReady(true), 100);
      return () => clearTimeout(t);
    }
  }, [portal]);

  if (!portal) return null;

  // Data transformations
  const convData = data.conversationStats?.map(s => ({ date: s.date, total: s.total, active: s.active, closed: s.closed })) || [];
  const peakData = data.conversationStats?.map(s => ({ date: s.date, total: s.total })) || [];
  
  const formatDate = (d: string) => { try { return format(parseISO(d), 'MMM d'); } catch { return d; } };
  
  const trafficTrendData = data.trafficSourceTrend?.map(i => ({ ...i, formattedDate: formatDate(i.date) })) || [];
  const leadConvData = data.leadConversionTrend?.map(i => ({ 
    ...i, 
    formattedDate: formatDate(i.date as string),
    total: Object.values(i).filter(v => typeof v === 'number').reduce((a, b) => a + (b as number), 0)
  })) || [];
  const bookingTrendData = data.bookingTrend?.map(i => ({ ...i, formattedDate: formatDate(i.date) })) || [];
  
  const trafficSourceData = data.trafficSources?.map(s => ({
    name: s.source, value: s.visitors, fill: getColor(s.source)
  })) || [];
  
  const locationData = data.bookingStats?.map(s => ({
    locationId: s.location,
    locationName: s.location, 
    bookings: s.total, 
    confirmed: s.confirmed,
    completed: s.completed || 0,
    cancelled: s.cancelled, 
    noShow: s.no_show
  })) || [];
  
  const pagesData = data.topPages?.map(p => ({
    url: p.page, visits: p.visits, avgDuration: 0, conversions: p.conversations, bounceRate: p.bounce_rate
  })) || [];
  
  const depthData = data.pageDepthDistribution || [];
  const leadSrcData = data.leadSourceBreakdown || [];
  
  const csatData = data.satisfactionStats?.distribution?.map(d => ({
    rating: d.rating as 1 | 2 | 3 | 4 | 5,
    count: d.count,
    percentage: d.percentage,
  })) || [];

  return createPortal(
    <div ref={containerRef} className="bg-white text-foreground" style={{ width: CHART_WIDTH }}>
      <React.Suspense fallback={<div style={{ height: 100 }} />}>
        {config.includeConversations && convData.length > 0 && (
          <div data-chart-id="conversation-volume" style={{ width: CHART_WIDTH, minHeight: CHART_HEIGHT, padding: 16 }} className="bg-white">
            <LazyConversationChart data={convData} />
          </div>
        )}
        {config.includeConversationFunnel && data.conversationFunnel?.length && (
          <div data-chart-id="conversation-funnel" style={{ width: CHART_WIDTH, minHeight: 300, padding: 16 }} className="bg-white">
            <LazyConversationFunnelCard stages={data.conversationFunnel} />
          </div>
        )}
        {config.includePeakActivity && peakData.length > 0 && (
          <div data-chart-id="peak-activity" style={{ width: CHART_WIDTH, minHeight: 350, padding: 16 }} className="bg-white">
            <LazyPeakActivityChart conversationStats={peakData} />
          </div>
        )}
        {config.includeBookingTrend && bookingTrendData.length > 0 && (
          <div data-chart-id="booking-trend" style={{ width: CHART_WIDTH, minHeight: CHART_HEIGHT, padding: 16 }} className="bg-white">
            <LazyBookingTrendChart data={bookingTrendData} />
          </div>
        )}
        {config.includeBookings && locationData.length > 0 && (
          <div data-chart-id="bookings-by-location" style={{ width: CHART_WIDTH, minHeight: CHART_HEIGHT, padding: 16 }} className="bg-white">
            <LazyBookingsByLocationChart data={locationData} />
          </div>
        )}
        {config.includeTrafficSources && trafficSourceData.length > 0 && (
          <div data-chart-id="traffic-sources" style={{ width: CHART_WIDTH, minHeight: CHART_HEIGHT, padding: 16 }} className="bg-white">
            <LazyTrafficSourceChart data={trafficSourceData} />
          </div>
        )}
        {config.includeTrafficSourceTrend && trafficTrendData.length > 0 && (
          <div data-chart-id="traffic-source-trend" style={{ width: CHART_WIDTH, minHeight: CHART_HEIGHT, padding: 16 }} className="bg-white">
            <LazyTrafficSourceTrendChart data={trafficTrendData} />
          </div>
        )}
        {config.includeTopPages && pagesData.length > 0 && (
          <div data-chart-id="top-pages" style={{ width: CHART_WIDTH, minHeight: CHART_HEIGHT, padding: 16 }} className="bg-white">
            <LazyTopPagesChart data={pagesData} />
          </div>
        )}
        {config.includePageDepth && depthData.length > 0 && (
          <div data-chart-id="page-depth" style={{ width: CHART_WIDTH, minHeight: 300, padding: 16 }} className="bg-white">
            <LazyPageDepthChart data={depthData} />
          </div>
        )}
        {config.includeLeadSourceBreakdown && leadSrcData.length > 0 && (
          <div data-chart-id="lead-source-breakdown" style={{ width: CHART_WIDTH, minHeight: 300, padding: 16 }} className="bg-white">
            <LazyLeadSourceBreakdownCard data={leadSrcData} />
          </div>
        )}
        {config.includeSatisfaction && csatData.length > 0 && (
          <div data-chart-id="csat-distribution" style={{ width: CHART_WIDTH, minHeight: 300, padding: 16 }} className="bg-white">
            <LazyCSATDistributionCard 
              distribution={csatData}
              averageRating={data.satisfactionStats?.average_rating || 0}
              totalRatings={data.satisfactionStats?.total_ratings || 0}
            />
          </div>
        )}
        {config.includeLeadConversionTrend && leadConvData.length > 0 && (
          <div data-chart-id="lead-conversion-trend" style={{ width: CHART_WIDTH, minHeight: CHART_HEIGHT, padding: 16 }} className="bg-white">
            <LazyLeadConversionChart data={leadConvData} />
          </div>
        )}
      </React.Suspense>
    </div>,
    portal
  );
});

function getColor(src: string): string {
  const map: Record<string, string> = {
    Direct: 'hsl(220,90%,56%)', Organic: 'hsl(142,76%,36%)', Paid: 'hsl(38,92%,50%)',
    Social: 'hsl(280,85%,58%)', Email: 'hsl(340,75%,54%)', Referral: 'hsl(190,95%,45%)'
  };
  return map[src] || 'hsl(var(--muted))';
}