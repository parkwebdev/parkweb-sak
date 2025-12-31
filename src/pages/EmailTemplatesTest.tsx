/**
 * Email Templates Test Page
 * 
 * Dev-only page for previewing and testing email templates with sidebar navigation.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Copy01, Send01, Loading02, Phone01, Monitor01, Moon01, Sun } from '@untitledui/icons';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { EmailTemplateSidebar, type EmailTemplateType } from '@/components/email/EmailTemplateSidebar';
import {
  generateTeamInvitationEmail,
  generateNotificationEmail,
  generateBookingConfirmationEmail,
  generateScheduledReportEmail,
  type TeamInvitationData,
  type NotificationData,
  type BookingConfirmationData,
  type ScheduledReportData,
} from '@/lib/email-templates';

type PreviewWidth = 'mobile' | 'desktop';

interface EmailPreviewProps {
  html: string;
  width: PreviewWidth;
  showSource: boolean;
  templateType: string;
  subject: string;
  darkMode: boolean;
}

function EmailPreview({ html, width, showSource, templateType, subject, darkMode }: EmailPreviewProps) {
  const iframeWidth = width === 'mobile' ? 375 : 600;
  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  const copyHtml = () => {
    navigator.clipboard.writeText(html);
    toast.success('HTML copied to clipboard');
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter an email address');
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-test-email', {
        body: { to: testEmail, templateType, html, subject },
      });

      if (error) throw error;
      toast.success(`Test email sent to ${testEmail}`);
      setTestEmail('');
    } catch (error: any) {
      console.error('Failed to send test email:', error);
      toast.error(error.message || 'Failed to send test email');
    } finally {
      setIsSending(false);
    }
  };

  // Simulate dark mode email client by injecting forced dark mode styles
  // This overrides the @media (prefers-color-scheme: dark) with explicit styles
  const getDarkModeHtml = () => {
    if (!darkMode) return html;
    
    // Inject forced dark mode styles that override the email's classes
    const darkModeStyles = `
      <style type="text/css">
        /* Force dark mode - override all email template classes */
        .email-bg { background-color: #0a0a0a !important; }
        .email-card { background-color: #171717 !important; }
        .email-text { color: #fafafa !important; }
        .email-text-muted { color: #a3a3a3 !important; }
        .email-border { border-color: #262626 !important; }
        .email-btn { background-color: #fafafa !important; }
        .email-btn-text { color: #171717 !important; }
        .email-detail-bg { background-color: #0a0a0a !important; }
        body { background-color: #0a0a0a !important; }
        table.email-bg { background-color: #0a0a0a !important; }
      </style>
    `;
    
    return html.replace('</head>', `${darkModeStyles}</head>`);
  };

  const previewHtml = getDarkModeHtml();

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b gap-4">
        <CardTitle className="text-sm font-medium shrink-0">
          {showSource ? 'HTML Source' : `Preview (${width === 'mobile' ? '375px' : '600px'})`}
          {darkMode && !showSource && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">• Dark Mode</span>
          )}
        </CardTitle>
        <div className="flex items-center gap-2 flex-1 justify-end">
          <Input
            type="email"
            placeholder="test@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="max-w-[200px] h-8 text-sm"
          />
          <Button variant="outline" size="sm" onClick={sendTestEmail} disabled={isSending || !testEmail}>
            {isSending ? <Loading02 size={16} className="mr-1 animate-spin" /> : <Send01 size={16} className="mr-1" />}
            Send Test
          </Button>
          <Button variant="ghost" size="sm" onClick={copyHtml}>
            <Copy01 size={16} className="mr-1" />
            Copy
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {showSource ? (
          <pre className="p-4 text-xs overflow-auto max-h-[600px] bg-muted">
            <code>{html}</code>
          </pre>
        ) : (
          <div 
            className="flex justify-center p-4 transition-colors duration-200"
            style={{ backgroundColor: darkMode ? '#0d0d0d' : '#f5f5f5' }}
          >
            <iframe
              srcDoc={previewHtml}
              style={{ 
                width: iframeWidth, 
                height: 650, 
                border: 'none', 
                background: darkMode ? '#1a1a1a' : '#ffffff',
                borderRadius: 8,
              }}
              title="Email Preview"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function EmailTemplatesTest() {
  const [activeTemplate, setActiveTemplate] = useState<EmailTemplateType>('invitation');
  const [previewWidth, setPreviewWidth] = useState<PreviewWidth>('desktop');
  const [showSource, setShowSource] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Team Invitation data
  const [invitationData, setInvitationData] = useState<TeamInvitationData>({
    invitedBy: 'John Smith',
    companyName: 'Acme Corporation',
    signupUrl: 'https://getpilot.io/signup?token=abc123',
  });

  // Notification data
  const [notificationData, setNotificationData] = useState<NotificationData>({
    title: 'New Lead Captured',
    message: 'A new lead has been captured from your chat widget. Sarah Johnson expressed interest in your Enterprise plan.',
    actionUrl: 'https://getpilot.io/leads',
    actionLabel: 'View Lead',
    type: 'team',
  });

  // Booking data
  const [bookingData, setBookingData] = useState<BookingConfirmationData>({
    visitorName: 'Michael Chen',
    eventType: 'Product Demo',
    date: 'Thursday, January 15, 2025',
    time: '2:00 PM',
    timezone: 'EST',
    location: 'Google Meet',
    notes: 'Looking forward to showing you our new features!',
    calendarLink: 'https://calendar.google.com/event?id=abc123',
  });

  // Report data
  const [reportData, setReportData] = useState<ScheduledReportData>({
    reportName: 'Weekly Analytics Report',
    dateRange: 'Jan 6 - Jan 12, 2025',
    metrics: [
      { label: 'Total Conversations', value: '1,247', change: '+12.5%' },
      { label: 'Leads Captured', value: '89', change: '+8.3%' },
      { label: 'Avg. Response Time', value: '1.2s', change: '-15%' },
      { label: 'Satisfaction Rate', value: '94%', change: '+2.1%' },
    ],
    viewReportUrl: 'https://getpilot.io/analytics',
  });

  // Generate HTML and subject based on active template
  const getTemplateHtml = () => {
    switch (activeTemplate) {
      case 'invitation': return generateTeamInvitationEmail(invitationData);
      case 'notification': return generateNotificationEmail(notificationData);
      case 'booking': return generateBookingConfirmationEmail(bookingData);
      case 'report': return generateScheduledReportEmail(reportData);
    }
  };

  const getTemplateSubject = () => {
    switch (activeTemplate) {
      case 'invitation': return `${invitationData.invitedBy} invited you to join ${invitationData.companyName} on Pilot`;
      case 'notification': return notificationData.title;
      case 'booking': return `Confirmed: ${bookingData.eventType} on ${bookingData.date}`;
      case 'report': return `${reportData.reportName} — ${reportData.dateRange}`;
    }
  };

  // Render mock data controls based on active template
  const renderMockDataControls = () => {
    switch (activeTemplate) {
      case 'invitation':
        return (
          <Card>
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-sm font-medium">Mock Data</CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inv-by" className="text-xs">Invited By</Label>
                <Input
                  id="inv-by"
                  value={invitationData.invitedBy}
                  onChange={(e) => setInvitationData({ ...invitationData, invitedBy: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-company" className="text-xs">Company Name</Label>
                <Input
                  id="inv-company"
                  value={invitationData.companyName}
                  onChange={(e) => setInvitationData({ ...invitationData, companyName: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-url" className="text-xs">Signup URL</Label>
                <Input
                  id="inv-url"
                  value={invitationData.signupUrl}
                  onChange={(e) => setInvitationData({ ...invitationData, signupUrl: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 'notification':
        return (
          <Card>
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-sm font-medium">Mock Data</CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="notif-title" className="text-xs">Title</Label>
                <Input
                  id="notif-title"
                  value={notificationData.title}
                  onChange={(e) => setNotificationData({ ...notificationData, title: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notif-type" className="text-xs">Type</Label>
                <Select
                  value={notificationData.type}
                  onValueChange={(v) => setNotificationData({ ...notificationData, type: v as NotificationData['type'] })}
                >
                  <SelectTrigger id="notif-type" className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="scope_work">Scope Work</SelectItem>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="notif-message" className="text-xs">Message</Label>
                <Input
                  id="notif-message"
                  value={notificationData.message}
                  onChange={(e) => setNotificationData({ ...notificationData, message: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notif-action-url" className="text-xs">Action URL</Label>
                <Input
                  id="notif-action-url"
                  value={notificationData.actionUrl}
                  onChange={(e) => setNotificationData({ ...notificationData, actionUrl: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notif-action-label" className="text-xs">Action Label</Label>
                <Input
                  id="notif-action-label"
                  value={notificationData.actionLabel}
                  onChange={(e) => setNotificationData({ ...notificationData, actionLabel: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 'booking':
        return (
          <Card>
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-sm font-medium">Mock Data</CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="book-name" className="text-xs">Visitor Name</Label>
                <Input
                  id="book-name"
                  value={bookingData.visitorName}
                  onChange={(e) => setBookingData({ ...bookingData, visitorName: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="book-type" className="text-xs">Event Type</Label>
                <Input
                  id="book-type"
                  value={bookingData.eventType}
                  onChange={(e) => setBookingData({ ...bookingData, eventType: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="book-date" className="text-xs">Date</Label>
                <Input
                  id="book-date"
                  value={bookingData.date}
                  onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="book-time" className="text-xs">Time</Label>
                <Input
                  id="book-time"
                  value={bookingData.time}
                  onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="book-tz" className="text-xs">Timezone</Label>
                <Input
                  id="book-tz"
                  value={bookingData.timezone}
                  onChange={(e) => setBookingData({ ...bookingData, timezone: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="book-loc" className="text-xs">Location</Label>
                <Input
                  id="book-loc"
                  value={bookingData.location || ''}
                  onChange={(e) => setBookingData({ ...bookingData, location: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 'report':
        return (
          <Card>
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-sm font-medium">Mock Data</CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="report-name" className="text-xs">Report Name</Label>
                <Input
                  id="report-name"
                  value={reportData.reportName}
                  onChange={(e) => setReportData({ ...reportData, reportName: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="report-range" className="text-xs">Date Range</Label>
                <Input
                  id="report-range"
                  value={reportData.dateRange}
                  onChange={(e) => setReportData({ ...reportData, dateRange: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="h-screen bg-background flex min-h-0">
      {/* Left Sidebar */}
      <EmailTemplateSidebar activeTemplate={activeTemplate} onTemplateChange={setActiveTemplate} />

      {/* Right Content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Email Templates</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Preview and test email templates with mock data</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Width Toggle */}
              <div className="flex items-center gap-1 bg-muted/50 rounded-md p-0.5">
                <Button
                  variant={previewWidth === 'mobile' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewWidth('mobile')}
                  className="h-7 text-xs px-3"
                >
                  <Phone01 size={14} className="mr-1" />
                  Mobile
                </Button>
                <Button
                  variant={previewWidth === 'desktop' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewWidth('desktop')}
                  className="h-7 text-xs px-3"
                >
                  <Monitor01 size={14} className="mr-1" />
                  Desktop
                </Button>
              </div>

              {/* Dark Mode Toggle */}
              <div className="flex items-center gap-1 bg-muted/50 rounded-md p-0.5">
                <Button
                  variant={!darkMode ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setDarkMode(false)}
                  className="h-7 text-xs px-2"
                >
                  <Sun size={14} />
                </Button>
                <Button
                  variant={darkMode ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setDarkMode(true)}
                  className="h-7 text-xs px-2"
                >
                  <Moon01 size={14} />
                </Button>
              </div>

              {/* Source Toggle */}
              <div className="flex items-center gap-2">
                <Label htmlFor="show-source" className="text-xs text-muted-foreground">Source</Label>
                <Switch id="show-source" checked={showSource} onCheckedChange={setShowSource} />
              </div>
            </div>
          </div>

          {/* Mock Data Controls */}
          {renderMockDataControls()}

          {/* Email Preview */}
          <EmailPreview
            html={getTemplateHtml()}
            width={previewWidth}
            showSource={showSource}
            darkMode={darkMode}
            templateType={activeTemplate}
            subject={getTemplateSubject()}
          />
        </div>
      </main>
    </div>
  );
}
