/**
 * PDF Test Page
 * 
 * Development-only page for previewing PDF reports exactly as they render.
 * Uses @react-pdf/renderer's PDFViewer for real-time preview.
 * 
 * @module pages/PDFTestPage
 */

import { useState, useMemo } from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { AnalyticsReportPDF } from '@/lib/pdf-components';
import { generateBeautifulPDF } from '@/lib/pdf-generator';
import type { PDFData, PDFConfig, ReportType } from '@/types/pdf';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Download02, RefreshCcw01 } from '@untitledui/icons';
import { subDays, format } from 'date-fns';

// Comprehensive sample data matching PDFData interface
const SAMPLE_PDF_DATA: PDFData = {
  // KPI Data
  totalConversations: 1247,
  conversationsChange: 12.5,
  totalLeads: 342,
  leadsChange: -3.2,
  conversionRate: 27.4,

  // Conversation Stats (7 days)
  conversationStats: [
    { date: '2024-12-23', total: 156, active: 89, closed: 67 },
    { date: '2024-12-24', total: 142, active: 76, closed: 66 },
    { date: '2024-12-25', total: 98, active: 45, closed: 53 },
    { date: '2024-12-26', total: 178, active: 102, closed: 76 },
    { date: '2024-12-27', total: 203, active: 118, closed: 85 },
    { date: '2024-12-28', total: 187, active: 95, closed: 92 },
    { date: '2024-12-29', total: 283, active: 156, closed: 127 },
  ],

  // Conversation Funnel
  conversationFunnel: [
    { name: 'Started', count: 1247, percentage: 100, dropOffPercent: 0 },
    { name: 'Engaged', count: 892, percentage: 71.5, dropOffPercent: 28.5 },
    { name: 'Lead Captured', count: 456, percentage: 36.6, dropOffPercent: 48.9 },
    { name: 'Booked', count: 342, percentage: 27.4, dropOffPercent: 25.0 },
    { name: 'Resolved', count: 298, percentage: 23.9, dropOffPercent: 12.9 },
  ],

  // Peak Activity
  peakActivity: {
    peakDay: 'Friday',
    peakTime: '2:00 PM',
    peakValue: 283,
  },

  // Lead Stats
  leadStats: [
    { date: '2024-12-23', total: 42 },
    { date: '2024-12-24', total: 38 },
    { date: '2024-12-25', total: 25 },
    { date: '2024-12-26', total: 56 },
    { date: '2024-12-27', total: 67 },
    { date: '2024-12-28', total: 52 },
    { date: '2024-12-29', total: 62 },
  ],

  // Lead Source Breakdown
  leadSourceBreakdown: [
    { source: 'Organic Search', leads: 145, sessions: 3240, cvr: 4.5 },
    { source: 'Direct', leads: 89, sessions: 1890, cvr: 4.7 },
    { source: 'Paid Ads', leads: 67, sessions: 1120, cvr: 6.0 },
    { source: 'Social Media', leads: 28, sessions: 890, cvr: 3.1 },
    { source: 'Referral', leads: 13, sessions: 420, cvr: 3.1 },
  ],

  // Booking Stats by Location
  bookingStats: [
    { location: 'Downtown Office', total: 89, confirmed: 67, completed: 54, no_show: 8, show_rate: 87 },
    { location: 'Mall Location', total: 67, confirmed: 52, completed: 48, no_show: 3, show_rate: 92 },
    { location: 'Airport Branch', total: 45, confirmed: 38, completed: 32, no_show: 4, show_rate: 89 },
    { location: 'Online / Virtual', total: 141, confirmed: 112, completed: 98, no_show: 12, show_rate: 88 },
  ],

  // Booking Trend
  bookingTrend: [
    { date: '2024-12-23', confirmed: 12, completed: 10, cancelled: 2, noShow: 1 },
    { date: '2024-12-24', confirmed: 15, completed: 13, cancelled: 1, noShow: 2 },
    { date: '2024-12-25', confirmed: 8, completed: 6, cancelled: 1, noShow: 1 },
    { date: '2024-12-26', confirmed: 18, completed: 15, cancelled: 2, noShow: 1 },
    { date: '2024-12-27', confirmed: 22, completed: 19, cancelled: 2, noShow: 2 },
    { date: '2024-12-28', confirmed: 19, completed: 16, cancelled: 3, noShow: 2 },
    { date: '2024-12-29', confirmed: 25, completed: 21, cancelled: 3, noShow: 2 },
  ],

  // Satisfaction Stats
  satisfactionStats: {
    average_rating: 4.3,
    total_ratings: 287,
    distribution: [
      { rating: 5, count: 142 },
      { rating: 4, count: 89 },
      { rating: 3, count: 34 },
      { rating: 2, count: 15 },
      { rating: 1, count: 7 },
    ],
  },

  // Recent Feedback
  recentFeedback: [
    { rating: 5, feedback: 'Ari was incredibly helpful and answered all my questions quickly!', createdAt: '2024-12-29T14:32:00Z', triggerType: 'conversation_end' },
    { rating: 4, feedback: 'Good experience, but took a bit to understand my question.', createdAt: '2024-12-29T11:15:00Z', triggerType: 'conversation_end' },
    { rating: 5, feedback: 'Booking was seamless. Love this!', createdAt: '2024-12-28T16:45:00Z', triggerType: 'booking_complete' },
    { rating: 3, feedback: null, createdAt: '2024-12-28T09:20:00Z', triggerType: 'conversation_end' },
    { rating: 5, feedback: 'Best AI assistant I have used.', createdAt: '2024-12-27T15:10:00Z', triggerType: 'conversation_end' },
  ],

  // AI Performance Stats
  aiPerformanceStats: {
    containment_rate: 87.3,
    resolution_rate: 92.1,
    ai_handled: 1089,
    human_takeover: 158,
    total_conversations: 1247,
  },

  // Traffic Sources
  trafficSources: [
    { source: 'Direct', visitors: 4521, percentage: 35.2 },
    { source: 'Google', visitors: 3845, percentage: 29.9 },
    { source: 'Social', visitors: 2134, percentage: 16.6 },
    { source: 'Referral', visitors: 1456, percentage: 11.3 },
    { source: 'Email', visitors: 897, percentage: 7.0 },
  ],

  // Traffic Source Trend
  trafficSourceTrend: [
    { date: '2024-12-23', direct: 620, organic: 540, paid: 180, social: 290, email: 120, referral: 190 },
    { date: '2024-12-24', direct: 580, organic: 510, paid: 160, social: 310, email: 130, referral: 175 },
    { date: '2024-12-25', direct: 420, organic: 380, paid: 90, social: 260, email: 85, referral: 140 },
    { date: '2024-12-26', direct: 690, organic: 620, paid: 220, social: 340, email: 145, referral: 210 },
    { date: '2024-12-27', direct: 750, organic: 680, paid: 250, social: 380, email: 160, referral: 230 },
    { date: '2024-12-28', direct: 710, organic: 640, paid: 230, social: 350, email: 150, referral: 215 },
    { date: '2024-12-29', direct: 751, organic: 675, paid: 245, social: 365, email: 155, referral: 225 },
  ],

  // Top Pages
  topPages: [
    { page: '/pricing', visits: 2340, bounce_rate: 32.5, conversations: 187 },
    { page: '/features', visits: 1890, bounce_rate: 28.3, conversations: 145 },
    { page: '/about', visits: 1456, bounce_rate: 45.2, conversations: 67 },
    { page: '/contact', visits: 1234, bounce_rate: 22.1, conversations: 234 },
    { page: '/blog/getting-started', visits: 987, bounce_rate: 38.7, conversations: 89 },
  ],

  // Page Engagement
  pageEngagement: {
    bounceRate: 34.2,
    avgPagesPerSession: 3.4,
    totalSessions: 12853,
    overallCVR: 2.7,
  },

  // Page Depth Distribution
  pageDepthDistribution: [
    { depth: '1 page', count: 4398, percentage: 34.2 },
    { depth: '2-3 pages', count: 5141, percentage: 40.0 },
    { depth: '4-5 pages', count: 2056, percentage: 16.0 },
    { depth: '6+ pages', count: 1258, percentage: 9.8 },
  ],

  // Visitor Locations
  visitorLocations: [
    { country: 'United States', visitors: 6420, percentage: 49.9 },
    { country: 'United Kingdom', visitors: 1542, percentage: 12.0 },
    { country: 'Canada', visitors: 1285, percentage: 10.0 },
    { country: 'Germany', visitors: 897, percentage: 7.0 },
    { country: 'Australia', visitors: 771, percentage: 6.0 },
    { country: 'Other', visitors: 1938, percentage: 15.1 },
  ],
};

// Default config with all sections enabled
const DEFAULT_CONFIG: PDFConfig = {
  type: 'detailed',
  includeKPIs: true,
  includeCharts: true,
  includeTables: true,
  includeConversations: true,
  includeConversationFunnel: true,
  includePeakActivity: true,
  includeLeads: true,
  includeLeadSourceBreakdown: true,
  includeLeadConversionTrend: true,
  includeBookings: true,
  includeBookingTrend: true,
  includeSatisfaction: true,
  includeCustomerFeedback: true,
  includeAIPerformance: true,
  includeTrafficSources: true,
  includeTrafficSourceTrend: true,
  includeTopPages: true,
  includePageEngagement: true,
  includePageDepth: true,
  includeVisitorLocations: true,
};

/**
 * PDF Test Page Component
 * Renders a live PDF preview with interactive controls
 */
export default function PDFTestPage() {
  const [config, setConfig] = useState<PDFConfig>(DEFAULT_CONFIG);
  const [orgName, setOrgName] = useState('Acme Corporation');
  const [startDate] = useState(() => subDays(new Date(), 7));
  const [endDate] = useState(() => new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  // Toggle a config option
  const toggleConfig = (key: keyof PDFConfig) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Set report type
  const setReportType = (type: ReportType) => {
    setConfig(prev => ({ ...prev, type }));
  };

  // Force refresh the PDF viewer
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Download the PDF
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const blob = await generateBeautifulPDF({
        data: SAMPLE_PDF_DATA,
        config,
        startDate,
        endDate,
        orgName,
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test-report-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Memoize the PDF document to prevent unnecessary re-renders
  const pdfDocument = useMemo(() => (
    <AnalyticsReportPDF
      key={refreshKey}
      data={SAMPLE_PDF_DATA}
      config={config}
      startDate={startDate}
      endDate={endDate}
      orgName={orgName}
    />
  ), [config, startDate, endDate, orgName, refreshKey]);

  // Config section toggles grouped by category
  const configSections = [
    {
      title: 'General',
      items: [
        { key: 'includeKPIs', label: 'KPI Cards' },
        { key: 'includeCharts', label: 'Charts' },
        { key: 'includeTables', label: 'Tables' },
      ],
    },
    {
      title: 'Conversations',
      items: [
        { key: 'includeConversations', label: 'Conversation Stats' },
        { key: 'includeConversationFunnel', label: 'Conversation Funnel' },
        { key: 'includePeakActivity', label: 'Peak Activity' },
      ],
    },
    {
      title: 'Leads',
      items: [
        { key: 'includeLeads', label: 'Lead Stats' },
        { key: 'includeLeadSourceBreakdown', label: 'Lead Source Breakdown' },
        { key: 'includeLeadConversionTrend', label: 'Lead Conversion Trend' },
      ],
    },
    {
      title: 'Bookings',
      items: [
        { key: 'includeBookings', label: 'Booking Stats' },
        { key: 'includeBookingTrend', label: 'Booking Trend' },
      ],
    },
    {
      title: 'Customer Satisfaction',
      items: [
        { key: 'includeSatisfaction', label: 'Satisfaction Metrics' },
        { key: 'includeCustomerFeedback', label: 'Customer Feedback' },
      ],
    },
    {
      title: 'AI Performance',
      items: [
        { key: 'includeAIPerformance', label: 'AI Performance' },
      ],
    },
    {
      title: 'Traffic & Pages',
      items: [
        { key: 'includeTrafficSources', label: 'Traffic Sources' },
        { key: 'includeTrafficSourceTrend', label: 'Traffic Source Trend' },
        { key: 'includeTopPages', label: 'Top Pages' },
        { key: 'includePageEngagement', label: 'Page Engagement' },
        { key: 'includePageDepth', label: 'Page Depth' },
        { key: 'includeVisitorLocations', label: 'Visitor Locations' },
      ],
    },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Controls Sidebar */}
      <div className="w-80 border-r border-border flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-border flex-shrink-0">
          <h1 className="text-lg font-semibold text-foreground">PDF Test Page</h1>
          <p className="text-sm text-muted-foreground">Preview and debug PDF reports</p>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-6">
            {/* Header Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Header Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="orgName" className="text-xs">Organization Name</Label>
                  <Input
                    id="orgName"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Enter organization name"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Date Range</Label>
                  <p className="text-sm text-muted-foreground">
                    {format(startDate, 'MMM d, yyyy')} – {format(endDate, 'MMM d, yyyy')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Report Type */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Report Type</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={config.type}
                  onValueChange={(value) => setReportType(value as ReportType)}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="summary" id="type-summary" />
                    <Label htmlFor="type-summary" className="text-sm font-normal">Summary</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="detailed" id="type-detailed" />
                    <Label htmlFor="type-detailed" className="text-sm font-normal">Detailed</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="comparison" id="type-comparison" />
                    <Label htmlFor="type-comparison" className="text-sm font-normal">Comparison</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Section Toggles */}
            {configSections.map((section) => (
              <Card key={section.title}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{section.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {section.items.map((item) => (
                    <div key={item.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={item.key}
                        checked={config[item.key as keyof PDFConfig] as boolean}
                        onCheckedChange={() => toggleConfig(item.key as keyof PDFConfig)}
                      />
                      <Label htmlFor={item.key} className="text-sm font-normal cursor-pointer">
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="p-4 border-t border-border space-y-2 flex-shrink-0">
          <Button onClick={handleRefresh} variant="outline" className="w-full" size="sm">
            <RefreshCcw01 className="mr-2 h-4 w-4" />
            Refresh Preview
          </Button>
          <Button onClick={handleDownload} className="w-full" size="sm" disabled={isDownloading}>
            <Download02 className="mr-2 h-4 w-4" />
            {isDownloading ? 'Generating...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 bg-muted/50 h-full overflow-hidden">
        <PDFViewer
          width="100%"
          height="100%"
          showToolbar={true}
          className="border-0"
        >
          {pdfDocument}
        </PDFViewer>
      </div>
    </div>
  );
}
