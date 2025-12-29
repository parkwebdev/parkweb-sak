/**
 * PDF Test Page
 * 
 * Development-only page for previewing PDF reports exactly as they render.
 * Uses blob iframe for CSP-friendly live preview (Chrome's native PDF viewer).
 * 
 * @module pages/PDFTestPage
 */

import { useState, useEffect, useCallback } from 'react';
import { pdf } from '@react-pdf/renderer';
import { AnalyticsReportPDF } from '@/lib/pdf-components';
import { generateBeautifulPDF } from '@/lib/pdf-generator';
import type { PDFData, PDFConfig, ReportType } from '@/types/pdf';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Download02, RefreshCcw01, Loading02, ChevronDown, AlertTriangle, CheckCircle, AlertCircle } from '@untitledui/icons';
import { PdfJsViewer } from '@/components/pdf/PdfJsViewer';
import { subDays, format } from 'date-fns';

// Build stamp for cache verification
const BUILD_STAMP = `Build: ${new Date().toISOString().slice(0, 19)}`;

// Render modes for PDF preview
type RenderMode = 'pdfjs' | 'object' | 'iframe' | 'embed' | 'none';

// CSP Diagnostics interface
interface CSPDiagnostics {
  metaCSP: string | null;
  headerCSP: string | null;
  headerCSPReportOnly: string | null;
  objectSrcAllowsBlob: boolean;
  frameSrcAllowsBlob: boolean;
  environment: string;
  buildStamp: string;
  isLoading: boolean;
  error: string | null;
}

// Check if a CSP string allows blob: for a specific directive
function cspAllowsBlob(csp: string | null, directive: string): boolean {
  if (!csp) return true; // No CSP = allowed
  const regex = new RegExp(`${directive}\\s+([^;]+)`, 'i');
  const match = csp.match(regex);
  if (!match) {
    // Check for default-src if specific directive not found
    const defaultMatch = csp.match(/default-src\s+([^;]+)/i);
    if (defaultMatch) {
      return defaultMatch[1].includes('blob:') || defaultMatch[1].includes("'none'") === false;
    }
    return true; // Directive not specified = allowed
  }
  return match[1].includes('blob:');
}

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
  const [renderMode, setRenderMode] = useState<RenderMode>('pdfjs');
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [embedBlocked, setEmbedBlocked] = useState(false);
  
  // PDF ArrayBuffer for PDF.js viewer
  const [pdfArrayBuffer, setPdfArrayBuffer] = useState<ArrayBuffer | null>(null);
  
  // Blob preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  
  // CSP Diagnostics state
  const [cspDiagnostics, setCspDiagnostics] = useState<CSPDiagnostics>({
    metaCSP: null,
    headerCSP: null,
    headerCSPReportOnly: null,
    objectSrcAllowsBlob: true,
    frameSrcAllowsBlob: true,
    environment: 'unknown',
    buildStamp: BUILD_STAMP,
    isLoading: true,
    error: null,
  });
  
  // Fetch CSP diagnostics on mount
  useEffect(() => {
    const fetchCSPDiagnostics = async () => {
      try {
        // Get meta CSP
        const metaTag = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        const metaCSP = metaTag?.getAttribute('content') || null;
        
        // Try to get header CSP
        let headerCSP: string | null = null;
        let headerCSPReportOnly: string | null = null;
        
        try {
          const response = await fetch(window.location.href, {
            method: 'HEAD',
            cache: 'no-store',
          });
          headerCSP = response.headers.get('content-security-policy');
          headerCSPReportOnly = response.headers.get('content-security-policy-report-only');
        } catch (e) {
          console.warn('Could not fetch CSP headers:', e);
        }
        
        // The effective CSP is the header if it exists, otherwise the meta
        const effectiveCSP = headerCSP || metaCSP;
        
        setCspDiagnostics({
          metaCSP,
          headerCSP,
          headerCSPReportOnly,
          objectSrcAllowsBlob: cspAllowsBlob(effectiveCSP, 'object-src'),
          frameSrcAllowsBlob: cspAllowsBlob(effectiveCSP, 'frame-src'),
          environment: import.meta.env.MODE,
          buildStamp: BUILD_STAMP,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setCspDiagnostics(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch CSP',
        }));
      }
    };
    
    fetchCSPDiagnostics();
  }, []);

  // Toggle a config option
  const toggleConfig = (key: keyof PDFConfig) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Set report type
  const setReportType = (type: ReportType) => {
    setConfig(prev => ({ ...prev, type }));
  };

  // Force refresh the PDF viewer
  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Generate preview blob URL and ArrayBuffer
  useEffect(() => {
    let cancelled = false;
    const oldUrl = previewUrl;
    
    const generatePreview = async () => {
      setIsGeneratingPreview(true);
      setPreviewError(null);
      
      try {
        const doc = (
          <AnalyticsReportPDF
            data={SAMPLE_PDF_DATA}
            config={config}
            startDate={startDate}
            endDate={endDate}
            orgName={orgName}
          />
        );
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const blob = await pdf(doc as any).toBlob();
        
        if (!cancelled) {
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
          
          // Also store ArrayBuffer for PDF.js viewer
          const arrayBuffer = await blob.arrayBuffer();
          if (!cancelled) {
            setPdfArrayBuffer(arrayBuffer);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to generate PDF preview:', error);
          setPreviewError(error instanceof Error ? error.message : 'Failed to generate preview');
        }
      } finally {
        if (!cancelled) {
          setIsGeneratingPreview(false);
        }
      }
    };
    
    generatePreview();
    
    return () => {
      cancelled = true;
      // Revoke old URL on cleanup
      if (oldUrl) {
        URL.revokeObjectURL(oldUrl);
      }
    };
  }, [config, startDate, endDate, orgName, refreshKey]);

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
    <div className="flex h-full min-h-0 bg-background">
      {/* Controls Sidebar */}
      <div className="w-80 h-full min-h-0 overflow-hidden border-r border-border flex flex-col">
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

      {/* PDF Preview */}
      <div className="flex-1 h-full min-h-0 overflow-hidden flex flex-col bg-muted/50">
        {/* CSP Diagnostics Panel */}
        <Collapsible open={diagnosticsOpen} onOpenChange={setDiagnosticsOpen}>
          <CollapsibleTrigger asChild>
            <button className="w-full p-3 border-b border-border flex items-center justify-between bg-background hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                {cspDiagnostics.isLoading ? (
                  <Loading02 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : cspDiagnostics.objectSrcAllowsBlob && cspDiagnostics.frameSrcAllowsBlob ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
                <span className="text-sm font-medium">CSP Diagnostics</span>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${diagnosticsOpen ? 'rotate-180' : ''}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 border-b border-border bg-background space-y-4">
              {cspDiagnostics.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading CSP diagnostics...</p>
              ) : cspDiagnostics.error ? (
                <p className="text-sm text-destructive">Error: {cspDiagnostics.error}</p>
              ) : (
                <>
                  {/* Environment Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Environment:</span>
                      <span className="ml-2 font-mono">{cspDiagnostics.environment}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Build:</span>
                      <span className="ml-2 font-mono text-[10px]">{cspDiagnostics.buildStamp}</span>
                    </div>
                  </div>
                  
                  {/* CSP Status */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {cspDiagnostics.objectSrcAllowsBlob ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-xs">
                        object-src blob: {cspDiagnostics.objectSrcAllowsBlob ? 'ALLOWED' : 'BLOCKED'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {cspDiagnostics.frameSrcAllowsBlob ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-xs">
                        frame-src blob: {cspDiagnostics.frameSrcAllowsBlob ? 'ALLOWED' : 'BLOCKED'}
                      </span>
                    </div>
                  </div>
                  
                  {/* CSP Details */}
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Meta CSP:</p>
                      <pre className="text-[10px] font-mono bg-muted p-2 rounded overflow-x-auto max-h-20 whitespace-pre-wrap break-all">
                        {cspDiagnostics.metaCSP || '(none)'}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Header CSP:</p>
                      <pre className="text-[10px] font-mono bg-muted p-2 rounded overflow-x-auto max-h-20 whitespace-pre-wrap break-all">
                        {cspDiagnostics.headerCSP || '(none - meta CSP applies)'}
                      </pre>
                    </div>
                    {cspDiagnostics.headerCSPReportOnly && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Header CSP (Report Only):</p>
                        <pre className="text-[10px] font-mono bg-muted p-2 rounded overflow-x-auto max-h-20 whitespace-pre-wrap break-all">
                          {cspDiagnostics.headerCSPReportOnly}
                        </pre>
                      </div>
                    )}
                  </div>
                  
                  {/* Diagnosis */}
                  {cspDiagnostics.headerCSP && !cspDiagnostics.objectSrcAllowsBlob && (
                    <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded text-xs">
                      <strong>Issue:</strong> Server is sending a CSP header that blocks blob: for object-src. 
                      Fix this in your hosting config (netlify.toml, vercel.json, etc.), not in index.html.
                    </div>
                  )}
                  {!cspDiagnostics.headerCSP && !cspDiagnostics.objectSrcAllowsBlob && (
                    <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded text-xs">
                      <strong>Issue:</strong> Meta CSP blocks blob: for object-src. Check index.html.
                    </div>
                  )}
                </>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        {/* Preview toolbar with render mode toggle */}
        <div className="p-2 border-b border-border flex items-center gap-4 flex-shrink-0 bg-background">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Render:</span>
            <RadioGroup
              value={renderMode}
              onValueChange={(v) => setRenderMode(v as RenderMode)}
              className="flex items-center gap-3"
            >
              <div className="flex items-center gap-1">
                <RadioGroupItem value="pdfjs" id="mode-pdfjs" className="h-3 w-3" />
                <Label htmlFor="mode-pdfjs" className="text-xs cursor-pointer font-medium text-primary">pdf.js</Label>
              </div>
              <div className="flex items-center gap-1">
                <RadioGroupItem value="object" id="mode-object" className="h-3 w-3" />
                <Label htmlFor="mode-object" className="text-xs cursor-pointer">object</Label>
              </div>
              <div className="flex items-center gap-1">
                <RadioGroupItem value="iframe" id="mode-iframe" className="h-3 w-3" />
                <Label htmlFor="mode-iframe" className="text-xs cursor-pointer">iframe</Label>
              </div>
              <div className="flex items-center gap-1">
                <RadioGroupItem value="embed" id="mode-embed" className="h-3 w-3" />
                <Label htmlFor="mode-embed" className="text-xs cursor-pointer">embed</Label>
              </div>
              <div className="flex items-center gap-1">
                <RadioGroupItem value="none" id="mode-none" className="h-3 w-3" />
                <Label htmlFor="mode-none" className="text-xs cursor-pointer">no-embed</Label>
              </div>
            </RadioGroup>
          </div>
          
          {previewUrl && (
            <div className="flex items-center gap-2 ml-auto">
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Open in new tab
              </a>
              <Button onClick={handleDownload} variant="ghost" size="sm" className="h-6 px-2 text-xs">
                <Download02 className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          )}
        </div>
        
        {isGeneratingPreview && (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loading02 className="h-8 w-8 animate-spin" />
              <p className="text-sm">Generating preview...</p>
            </div>
          </div>
        )}
        
        {previewError && !isGeneratingPreview && (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-destructive max-w-md text-center p-4">
              <p className="text-sm font-medium">Failed to generate preview</p>
              <p className="text-xs text-muted-foreground">{previewError}</p>
              <Button onClick={handleRefresh} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          </div>
        )}
        
        {/* PDF.js Viewer (default - works even when embeds are blocked) */}
        {pdfArrayBuffer && !isGeneratingPreview && !previewError && renderMode === 'pdfjs' && (
          <PdfJsViewer data={pdfArrayBuffer} initialScale={1.2} mode="all" />
        )}
        
        {previewUrl && !isGeneratingPreview && !previewError && renderMode === 'object' && (
          <object
            data={previewUrl}
            type="application/pdf"
            className="flex-1 w-full"
            onError={() => setEmbedBlocked(true)}
          >
            {/* Enhanced fallback UI when object embed is blocked */}
            <div className="flex-1 flex items-center justify-center p-8 h-full">
              <Card className="max-w-md">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    PDF Embed Blocked
                  </CardTitle>
                  <CardDescription>
                    Your browser or an extension is blocking embedded PDFs. Use the buttons below to view the generated report.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Open PDF in New Tab
                    </a>
                    <Button onClick={handleDownload} variant="outline" className="w-full">
                      <Download02 className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><strong>Troubleshooting:</strong></p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>Use <strong>pdf.js</strong> mode (recommended - always works)</li>
                      <li>Try a different render mode (iframe, embed)</li>
                      <li>Disable browser extensions (ad blockers, PDF viewers)</li>
                      <li>Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Win)</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </object>
        )}
        
        {previewUrl && !isGeneratingPreview && !previewError && renderMode === 'iframe' && (
          <iframe
            src={previewUrl}
            className="flex-1 w-full border-0"
            title="PDF Preview"
          />
        )}
        
        {previewUrl && !isGeneratingPreview && !previewError && renderMode === 'embed' && (
          <embed
            src={previewUrl}
            type="application/pdf"
            className="flex-1 w-full"
          />
        )}
        
        {previewUrl && !isGeneratingPreview && !previewError && renderMode === 'none' && (
          <div className="flex-1 flex items-center justify-center p-8">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle className="text-base">PDF Preview Disabled</CardTitle>
                <CardDescription>
                  Embedding is disabled. Use the buttons below to view or download the PDF.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Open PDF in New Tab
                  </a>
                  <Button onClick={handleDownload} variant="outline" className="w-full">
                    <Download02 className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
